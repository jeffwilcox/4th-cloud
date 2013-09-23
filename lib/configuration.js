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

var path = require('path'),
	fs = require('fs'),
	azure = require('azure');

var mode = 'production';

var bootstrap = {
	key: undefined,
	account: undefined,
	container: 'conf'	
};

if (process.argv.length > 2) {
    mode = process.argv[2];
}

// Local development support
if (fs.existsSync('bootstrap.json')) {
	bootstrap = require('../bootstrap.json');
	console.log('Using local development configuration bootstrap credentials...');
}

// Command line parameter override.
if (process.argv.length > 3) {
	bootstrap.account = process.argv[3];
}
if (process.argv.length > 4) {
	bootstrap.key = process.argv[4];
}

// Environment overrides.
if (process.env.KEY) {
	bootstrap.key = process.env.KEY;
}
if (process.env.ACCOUNT) {
	bootstrap.account = process.env.ACCOUNT;
}
if (process.env.CONTAINER) {
	bootstrap.container = process.env.CONTAINER;
}

if (process.env.MODE) {
    mode = process.env.MODE;
}

var port = process.env.PORT || 3000;

// Storage service.
var blobService = azure.createBlobService(bootstrap.account, bootstrap.key);

module.exports = function (role, callback) {
	// Validate role
	if (role !== 'web') {
		throw new Error('Unsupported role type: ' + role);
	}

	// Validate deployment envionrment
	if (mode == 'prod') {
		mode = 'production';
	} else if (mode == 'stage') {
		mode = 'staging';
	}

	if (mode != 'dev' && mode != 'staging' && mode != 'production') {
		throw new Error('Invalid mode (dev, staging, production): ' + mode);
	}

	var filename = '4th-config';
	if (mode == 'dev' || mode == 'staging') {
		filename += '.' + mode;
	}
	filename += '.json';

	if (mode !== 'production') {
		console.log('Downloading latest configuration file from the storage service... ' + filename);
	}

	// Download
	blobService.getBlobToText(
		bootstrap.container, 
		filename,
		function (err, text) {
			if (err) {
				throw new Error(err);
			}

			var json = JSON.parse(text);
			callback({
			    role: role,
			    mode: mode,

				aws: {
					id: json['aws-id'],
					secret: json['aws-secret'],
					snsArn: json['aws-sns-arn']
				},

				hosting: {
					windowsAzure: process.env.PORT !== undefined, // TODO: Better to use other variables such as APP_POOL_CONFIG contains C:\DWASFiles\Sites\nodesdk\Config\applicationhost.config
			        port: port
				},

				logging: {
					deletes: false,
					delays: false,
					pushHeaders: false,
					notificationDetails: true,
					reservationHandles: false,
					errors: true,
					firstTime: true,
					basics: false
				},

			    statistics: {
			        statsd: {
			            host: json['statsd-host'],
			            port: json['statsd-port']
			        },
			        prefix: json['stats-prefix'],
			        enabled: json['stats-enabled'] || false,
			    },

				foursquare: {
					// For push notifications, shared token with the phone app
					secret: json['foursquare-secret'],
					apiVersion: json['foursquare-api-version'],
					userAgent: json['foursquare-user-agent'],
						
					// For the web site
					web: {
						clientid: json['foursquare-web-clientid'],
						secret: json['foursquare-web-secret'],
						callbackUri: json['foursquare-web-callback']
					}
				},

				azure: {
					storageaccount: json['azure-storage-account'],
					storagekey: json['azure-storage-key'],
					container: {
						mail: json['azure-email-container']
					}
				},

				wns: {
					clientid: json['wns-client-id'],
					clientsecret: json['wns-client-secret']
				},

				mongo: {
					connectionString: json['mongo-connection-string'],
					sessionsConnectionString: json['mongo-sessions-connection-string']
				},

				tableName: {
					clients: json['table-clients'],
					friends: json['table-friends'],
					history: json['table-history'],
					sessions: json['table-sessions']
				},

				dev: {
					myFoursquareUserId: json['foursquare-user-agent']
				},

				poll: {
					active: json['poll-active'],
					recent: json['poll-recent'],
					week: json['poll-week'],
					older: json['poll-older'],
					oldest: json['poll-oldest']
				},

				session: {
					secret: json['session-secret']
				},

				path: {
				},

				// technically these might belong better in 'Context'
				constants: {
					LIVE_TILE_SIZE: 173,
					MINI_LEADERBOARD_PHOTO_SIZE: 49,

					// TODO: Should really be a conf variable.
					REFRESH_LEADERBOARD_MINUTES: 720 // was formerly: 45
				}
			});
		}
	);
}
