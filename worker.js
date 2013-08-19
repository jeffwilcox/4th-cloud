//
// Copyright (C) Jeff Wilcox
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
// 4th & Mayor Cloud Worker Agent
// ---------------------------------------------------------------------------

// The push side is basically a Mongo + Foursquare high-frequency processing 
// agent, so it is sending hundreds of thousands of requests to fsq, Mongo,
// MPNS, etc.

var async = require('async')
  , path = require('path')
  , fs = require('fs');

var pushutil = require('./lib/pushutil')
  , cleanup = require('./lib/cleanup');

require('./lib/context').initialize(require('./lib/configuration'), function initializeContext(err, contextObject) {
    if (err) {
        var msg = 'Unfortunately startup went badly and the context could not be prepared.';
        contextObject.winston.error(err);
        throw new Error(msg);
    } else {
        var context = contextObject;

        // Temporary Photo Storage for tile generation
        context.configuration.path.temporaryPhotosDirectory =
            context.environment.isWindows === true ?
            process.env.TEMP + "\\49photos\\" :
            '/tmp/49photos/';

        cleanup.initialize(context);
        startupWorkerRole(context);
    }
});

// ---------------------------------------------------------------------------
// Initialization for the role/s
// ---------------------------------------------------------------------------
function startupWorkerRole(context) {
    if (context.configuration.path && context.configuration.path.temporaryPhotosDirectory) {
        if (!fs.existsSync(context.configuration.path.temporaryPhotosDirectory)) {
            fs.mkdirSync(context.configuration.path.temporaryPhotosDirectory);
        }
    }

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
                context.winston.error(err);
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
                            function (err, res) { 
                                context.winston.info('Removed an invalid URI.'); });
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
