//
// Copyright (C) 2011-2012 Jeff Wilcox
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

// ---------------------------------------------------------------------------
// Mongo imports and connection information
// ---------------------------------------------------------------------------
var Db = require('mongodb/lib/mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    mongo = require('mongodb');

var http = require('http'),
    path = require('path'),
    os = require('os');

var Context = {
    environment: {
        isWindows: os.platform() == 'win32',
        isWebServer: false,
        isPushWorker: false,
        isDevelopment: false,
        isSingleOperation: false,
        isStaging: false,
        instanceName: '---'
    },
    azure: {},
    configuration: {},
    statsd: undefined,
    stats: {},
    aws: undefined,
    mongo: {
        client: undefined,
        collections: {
            friends: undefined,
            clients: undefined
        },
        safe: { safe : true } // used for sending safe to Mongo DB. // TODO: This really is more of a `constant` not a runtime value.
    },
    foursquare: {
        config: undefined,
        create: function() {
            var fsq = require('node-foursquare')(Context.foursquare.config);
            return fsq;
        }
    }
};

function initialize(config, callback) {
    Context.configuration = config;
    
    // foursquare API config
    Context.foursquare.config = {
        'userAgent': config.foursquare.userAgent,
        'foursquare': {
            'version': config.foursquare.apiVersion
        },
        'secrets': {
            'clientId': 'not used',
            'clientSecret': 'not used',
            'redirectUrl': 'not used'
        }
    };

    Context.environment.isWebServer = config.role === 'web';
    Context.environment.isDevelopment = config.mode === 'dev';
    Context.environment.isStaging = config.mode === 'staging';

    var StatsD = require('node-statsd').StatsD;
    Context.statsd = new StatsD(config.statistics.statsd.host, config.statistics.statsd.port);

    Context.stats = require('./stats.js')(Context, config);

    Context.aws = {};
    Context.aws.mailCriticalWarning = function (text, callback) {
        var awsKeyId = config.aws.id;
        var awsSecret = config.aws.secret;
        var awsSnsUri = config.aws.snsArn;

        var aws = require('aws-lib');
        var sns = aws.createSNSClient(awsKeyId, awsSecret);

        var sms = {
            Message: text,
            TopicArn: awsSnsUri
        };

        sns.call('Publish', sms, function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        });
    };

    if (Context.environment.isDevelopment || Context.environment.isWindows || config.hosting.windowsAzure) {
        Context.environment.instanceName = config.hosting.windowsAzure ? "Powered by Windows Azure" : "Development Environment";
        
        if (Context.environment.isWebServer) {
            // On Azure, immediately start the web site to make sure there is 
            // no unncessary downtime.
            callback(undefined, Context);
            initializeMongo(Context, function() { });
        } else {
            initializeMongo(Context, callback);
        }

    } else {
        getInstanceData(Context, function (err, res) {
            initializeMongo(Context, callback);
        });
    }
}

function getInstanceData(context, callback) {
    console.log('Getting instance data...');

    var options = {
      host: '169.254.169.254',
      port: 80,
      path: '/latest/meta-data/instance-id',
      method: 'GET'
    };
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode);
      res.setEncoding('utf8');
      var body = '';
      res.on('socket', function (socket) {
        console.log('socket...');
       socket.setTimeout(1000);  
        socket.on('timeout', function() {
            console.log('abort...');
            req.abort();
        });
      });
      res.on('data', function (chunk) {
         body += chunk;
      });
      res.on('end', function () {

      var hostname = body;

      context.environment.instanceName = hostname;

      callback();

      });
    });
    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
      callback();
    });
    // req.setTimeout(1000); // 1 second!
    req.end();
}   

function initializeMongo(context, callback) { // (err, context)
    var configuration = context.configuration;
    var mongoCredentials = require('./mongoCredentials')(configuration.mongo.connectionString);
    var mongoClient = new Db(mongoCredentials.db,
                        new Server(mongoCredentials.server, 
                        mongoCredentials.port, { 
                            auto_reconnect: true, 
                            user: mongoCredentials.user, 
                            password: mongoCredentials.password })
                        );
    context.mongo.client = mongoClient;

    // Prepare the data tables now for my app.
    mongoClient.open(function (err, p_client) {
        mongoClient.authenticate(mongoCredentials.user, mongoCredentials.password, function (err, p_client) {
            if(err) {
                callback(err);
            } else {
                mongoClient.collection(configuration.tableName.clients, function (err, col) {
                    if(err) {
                        callback(err);
                    }
                    else {
                        context.mongo.collections.clients = col;
                        mongoClient.collection(configuration.tableName.friends, function (err, col) {
                            if(err) {
                                callback(err);
                            }
                            else {
                                context.mongo.collections.friends = col;

                                callback(undefined, context);
                            }
                        });
                    }
                });
            }
        });
    });
}

exports.initialize = function(config, callback) {
    initialize(config, callback);
}
