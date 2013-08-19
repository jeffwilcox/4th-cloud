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

var role = 'web';
var mode = 'dev';

var userid = '0';

if (process.argv.length > 2) {
    userid = process.argv[2];
    console.log('Processing for user ' + userid);
} else {
    console.log('Provide the user id.');
    return;
}

// Prepare configuration. Startup once ready.
var configuration = require('./lib/configuration')(role, mode);
var cleanup = require('./lib/cleanup');
var context = require('./lib/context')(configuration, role, mode, function(err) {
    if(err) {
        console.error('Unfortunately startup went badly and the context could not be prepared.');
        console.dir(err);
    } else {
        console.log('Cleaning up...');
        cleanup.initialize(context);

        // We're rocking!
        console.log('Starting up the role...');
        startupWorkerRole();
    }
});

var async = require('async');
var path = require('path');
var fs = require('fs');

var pushutil = require('./lib/pushutil');

context.configuration.path.temporaryPhotosDirectory = context.environment.isWindows === true ? "c:\\temp\\49photos\\" : '/tmp/49photos/'

function startupWorkerRole() {

    // The number of clients to process at a time.
    var clientLimit = 32;

    var clientWorkerTaskFactory = require('./lib/clientWorkerTask.js')(context);

    var now = new Date();

    var search = { 
        u: userid
    };
        //ping : { $lt: now } };

    var constraints = {
        limit: 1,
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
                      task.execute(function (err, res) {
                        console.log('Done executing!');

                        context.mongo.client.close();
                      });
                }
                else {
                    context.mongo.collections.clients.remove({ uri: pushUri },
                        context.mongo.safe,
                        function (err, res) { console.log('Removed an invalid URI'); });
                }
            }
        }
    });
}
