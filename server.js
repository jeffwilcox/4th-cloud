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
// 4th & Mayor
// Cloud Worker Agent
// ---------------------------------------------------------------------------

// This is my cloud worker, it's been a project for a while, but this 
// represents version 3... massively refactored but still quite dirty. The 
// entry point arguments will give you either a web server or a push 
// notification processing experience.

// The push side is basically a Mongo + Foursquare high-frequency processing 
// agent, so it is sending hundreds of thousands of requests to fsq, Mongo,
// MPNS, etc.

var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
  });
logger.cli();

var role = 'web'; // The default.
var mode = 'production';
if (process.argv.length > 2) {
    role = process.argv[2];
}
if (process.argv.length > 3) {
    mode = process.argv[3];
}

// Prepare configuration. Startup once ready.
var configuration = require('./lib/configuration')(role, mode);
var cleanup = require('./lib/cleanup');
var context = require('./lib/context')(configuration, role, mode, logger, function(err) {
    if(err) {
        logger.error('Unfortunately startup went badly and the context could not be prepared.');
        console.dir(err);
    } else {
        console.log('Cleaning up...');
        cleanup.initialize(context);

        // We're rocking!
        console.log('Starting up the role...');
        startupWorkerRole();
    }
});

// TODO: Support Foursquare real-time push notifications & the system around that concept.

var mpns = require('mpns');
var async = require('async');

var http = require('http');
var url = require('url');
var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var request = require('request');

var dateutil = require('./lib/dateutil');
var geo = require('./lib/geo');
var pushutil = require('./lib/pushutil');
var helpers = require('./lib/helpers');
var httputil = require('./lib/httputil');
var mayorlivetile = require('./lib/mayorlivetile');

// Random wild configuration values
// TODO: Move more of these to configuration...
var lastQuerySize = 0;

var inflightClients = 0;
var healthMinimumInFlight = 70; // 50;
var healthMinimumGrowth = 45; // 25; // kick off 5 when under 10.
var healthIntervalMs = 1000; // every 5 seconds.

// TODO: Refactor better.
context.configuration.path.temporaryPhotosDirectory = context.environment.isWindows === true ? "c:\\temp\\49photos\\" : '/tmp/49photos/'

function startupWorkerRole() {
    if (!path.existsSync(context.configuration.path.temporaryPhotosDirectory)) {
        context.logger.silly('creating the ' + context.configuration.path.temporaryPhotosDirectory + ' local storage directory');
        fs.mkdirSync(context.configuration.path.temporaryPhotosDirectory);
    }

    // ---------------------------------------------------------------------------
    // Web Services & Web Server Startup
    // ---------------------------------------------------------------------------
    if (context.environment.isWebServer === true) {
        var webserver = require('./lib/webserver');
        var app = webserver.initialize(context);
        app.listen(3000);
        
        logger.info('Web server is listening on port: 3000 ' + app.settings.env);
    }

    // ---------------------------------------------------------------------------
    // Cloud Worker Role
    // ---------------------------------------------------------------------------
    if (context.environment.isWebServer === false) {

        // Cleanup history entries every 5 minutes.
        function cleanupHistoryIn5Minutes() {
            setTimeout(function () { cleanup.cleanupHistoryTable(cleanupHistoryIn5Callback); },
                1000 /*ms*/ * 60 /* seconds */ * 5 /* minutes */);
        }
        function cleanupHistoryIn5Callback() { cleanupHistoryIn5Minutes(); }

        var clientWorkerTaskFactory = require('./lib/clientWorkerTask.js')(context);

        cleanup.cleanupOldClients();

        // The number of clients to process at a time.
        var clientLimit = 32;
        if (context.environment.isDevelopment) {
            console.log('Limiting to one client in the request for development mode.');
            clientLimit = 1;
        }

        // Setup a processing queue forever. In parallel, process 12 clients at a time.
        var queueConcurrency = 12;

        var qq = async.queue(function (task, callback) {
            task.execute(callback);
        }, queueConcurrency);

        qq.empty = function() {
            // Not doing anything specific here right now.
        }

        qq.drain = function() {
            // Get more work!
            getMoreWork(qq);
        }

        getMoreWork(qq);

        function getMoreWork(queue) {
            var now = new Date();

            var search = { ping : { $lt: now } };

            var constraints = {
                limit: clientLimit,
                sort: { ping: 1 }
            };

            context.mongo.collections.clients.find(search, constraints).toArray(function (err, res) {
                var c = 0;
                if (err) {
                    console.dir(err);
                } else if (res) {
                    for (var item in res) {
                        ++c;
                        var r = res[item];
                        var pushUri = r.uri;

                        if (pushutil.isValidUri(pushUri)) {
                              var task = clientWorkerTaskFactory.createTask(pushUri, r);
                              queue.push(task);
                        }
                        else {
                            context.mongo.collections.clients.remove({ uri: pushUri },
                                context.mongo.safe,
                                function (err, res) { console.log('Removed an invalid URI'); });
                        }
                    }
                }

                // If none were returned, let's keep trying for more results in 
                // a few seconds. This will keep from entirely DOSing.
                if (c == 0) {
                    setTimeout(function() {
                        getMoreWork(qq);
                    }, 4000 /* 4 seconds of pause time before next find() call */);
                }
            });
        }
    }
}
