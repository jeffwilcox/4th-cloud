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

var http = require('http');
var path = require('path');
var os = require('os');
var aws = require('aws-lib');

var isPush = path.existsSync('/home/ec2-user/.4thandmayor/is_push');
var isWeb = path.existsSync('/home/ec2-user/.4thandmayor/is_web');

var localHostname = os.hostname();

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

var awsKeyId = configuration.aws.id;
var awsSecret = configuration.aws.secret;
var awsSnsUri = configuration.aws.snsArn;

function sendNotification(hostname) {
  var sns = aws.createSNSClient(awsKeyId, awsSecret);
  var purpose = isWeb ? 'web' : '';
  purpose += isPush ? ' push' : '';

  var sms = {
      Message: purpose + ' up http://' + hostname + ':3000/',
      TopicArn: awsSnsUri
  };

  console.dir(sms);

  sns.call ( 'Publish', sms, function(result) {
      console.dir(result);
  } );
}

console.log('Local hostname is: ' + localHostname);

if (localHostname == 'JW-Air.local' || os.type() == 'Windows_NT') {
  console.log('(Development Environment)');
  
  console.log('Showing the parsed config file instead of using SNS:');
  console.dir(configuration);
  
  // sendNotification('local dev testing disregard');
} else {
  var options = {
    host: '169.254.169.254',
    port: 80,
    path: '/latest/meta-data/public-hostname',
    method: 'GET'
  };

  var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function (chunk) {
       body += chunk;
    });
    res.on('end', function () {

    var hostname = body;

    sendNotification(hostname);

    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();
}
