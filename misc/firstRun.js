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

var isPush = path.existsSync('/home/ec2-user/is_push');
var isWeb = path.existsSync('/home/ec2-user/is_web');

var aws = require('aws-lib');
var nconf = require('nconf');
var awsKeyId = 'KEY';
var awsSecret = 'SECRET';
var awsSnsUri = 'TBD';

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

  var sns = aws.createSNSClient(awsKeyId, awsSecret);
  var purpose = isWeb ? 'web' : '';
  purpose += isPush ? ' push' : '';

  var sms = {
      Message: purpose + ' up http://' + hostname + ':3000/',
      TopicArn: awsSnsUri
  };
  sns.call ( 'Publish', sms, function(result) {
      console.dir(result);
  } );

  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

req.end();