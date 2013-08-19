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
    mongo = require('mongodb'),
    MongoClient = require('mongodb').MongoClient;

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
    winston: undefined,
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

    var winston = require('winston');
    var logger = new winston.Logger();
    Context.winston = logger;
    if (Context.environment.isDevelopment) {
        logger.add(winston.transports.Console, undefined);
        logger.cli();
        logger.info('In development mode, Winston will not log to the Azure Table Service.');
    } else {
        var AzureTableService = require('./winston-azuretableservice').AzureTableService;
        logger.add(winston.transports.AzureTableService, {
              account: config.azure.storageaccount
            , accessKey: config.azure.storagekey
        });
    }

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
        Context.environment.instanceName = config.hosting.windowsAzure ? 
        "Powered by Windows Azure (" + config.mode + ")" : 
        "Development Environment (" + config.mode + ")";
        
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

//
// Amazon Web Services (legacy) code
// ---
function getInstanceData(context, callback) {
    var isAmazon = false;
    if (isAmazon) {
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

    callback && callback();
}   


function initializeMongo(context, callback) { // (err, context)
    var configuration = context.configuration;

    MongoClient.connect(configuration.mongo.connectionString, function (err, db) {
        if (err) {
            callback(err);
        } else {
            context.mongo.client = db;

            context.mongo.collections = {
                clients: db.collection(configuration.tableName.clients),
                friends: db.collection(configuration.tableName.friends)
            };

            callback(undefined, context);
        }
    });
}

exports.initialize = function(config, callback) {
    initialize(config, callback);
}
