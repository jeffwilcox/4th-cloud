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

var http = require('http');

// get info on the Amazon EC2 instance
// sample key: public-hostname
exports.getInstanceMetadata = function (key, callback) {
    var options = {
            host: '169.254.169.254',
            port: 80,
            path: '/latest/meta-data/' + key,
            method: 'GET'
        },
        req = http.request(options, function (res) {
            // console.log('STATUS: ' + res.statusCode);
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                // no error handling for now
                if (callback) {
                    callback(body);
                }
            });
        });
    req.end();
}

exports.getAllInstanceData = function () {
    getInstanceMetadata('public-hostname', function (cb) {
        localHostname = cb;
        console.log("local hostname: " + cb);
    });
    getInstanceMetadata('instance-id', function (cb) {
        localInstanceId = cb;
        console.log('local instance id: ' + cb);
    });
}
