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

var http = require('http');
var path = require('path');

var mongoClientsTable = 'clients';
var mongoFriendsTable = 'friends';

var os = require('os');

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

function initialize(config, role, mode, callback) {
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

    Context.environment.isWebServer = (role === 'web');
    Context.environment.isDevelopment = (mode === 'dev');
    Context.environment.isStaging = (mode === 'staging');

    if (Context.environment.isDevelopment) {
        initializeMongo(Context, callback);
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
      // path: '/latest/meta-data/public-hostname',
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

        // console.log('hostname: ' + hostname);

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

function initializeMongo(context, callback) { // (err)
    var configuration = context.configuration;
    var mongoClient = new Db(configuration.mongo.db,
                        new Server(configuration.mongo.server, 
                        configuration.mongo.port, { 
                            auto_reconnect: true, 
                            user: configuration.mongo.user, 
                            password: configuration.mongo.password })
                        );
    context.mongo.client = mongoClient;

    // BELOW IS AWESOME
    // THIS IS NODE CODE
    // BEFORE JEFF UNDERSTOOD NODE

    // Prepare the data tables now for my app.
    mongoClient.open(function(err, p_client) {
        mongoClient.authenticate(configuration.mongo.user, configuration.mongo.password, function(err, p_client) {
            if(err) {
                callback(err);
            } else {
                mongoClient.collection(mongoClientsTable, function(err, col) {
                    if(err) {
                        callback(err);
                    }
                    else {
                        context.mongo.collections.clients = col;
                        mongoClient.collection(mongoFriendsTable, function(err, col) {
                            if(err) {
                                callback(err);
                            }
                            else {
                                context.mongo.collections.friends = col;

                                callback(null);
                            }
                        });
                    }
                });
            }
        });
    });
}

module.exports = function(config, role, mode, callback) {
    initialize(config, role, mode, callback);
    return Context;
}
