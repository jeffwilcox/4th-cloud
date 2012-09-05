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

exports = module.exports;

module.exports = function (role, mode) {

	var path = require('path');
	var nconf = require('nconf');

	var filename = '4th-config';
	if (mode == 'dev' || mode == 'staging') {
		filename += '.' + mode;
	}
	filename += '.json';
	console.log(filename);
	
	nconf.argv()
	     .env()
	     .file({ file: '/home/ec2-user/4th-cloud/' + filename })
	     .file({ file: './' + filename });
	     
	nconf.load();

	var Configuration = {
		aws: {
			id: nconf.get('aws-id'),
			secret: nconf.get('aws-secret'),
			snsArn: nconf.get('aws-sns-arn')
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
		foursquare: {
			// For push notifications, shared token with the phone app
			secret: nconf.get('foursquare-secret'),
			apiVersion: nconf.get('foursquare-api-version'),
			userAgent: nconf.get('foursquare-user-agent'),
			
			// For the web site
			web: {
				clientid: nconf.get('foursquare-web-clientid'),
				secret: nconf.get('foursquare-web-secret'),
				callbackUri: nconf.get('foursquare-web-callback')
			}
		},
		azure: {
			storageaccount: nconf.get('azure-storage-account'),
			storagekey: nconf.get('azure-storage-key')
		},
		wns: {
			clientid: nconf.get('wns-client-id'),
			clientsecret: nconf.get('wns-client-secret')
		},
		mongo: {
			db: nconf.get('mongo-db'),
			server: nconf.get('mongo-server'),
			port: nconf.get('mongo-port'),
			user: nconf.get('mongo-user'),
			password: nconf.get('mongo-password')
		},
		dev: {
			myFoursquareUserId: nconf.get('foursquare-user-agent')
		},
		poll: {
			active: nconf.get('poll-active'),
			recent: nconf.get('poll-recent'),
			week: nconf.get('poll-week'),
			older: nconf.get('poll-older'),
			oldest: nconf.get('poll-oldest')
		},
		session: {
			secret: nconf.get('session-secret')
		},
		path: {
		},

		// technically these might belong better in 'Context'
		constants: {
			LIVE_TILE_SIZE: 173,
			MINI_LEADERBOARD_PHOTO_SIZE: 49,

			// TODO: Should really be a conf variable.
			REFRESH_LEADERBOARD_MINUTES: 720, // was formerly: 45
		}
	};

	return Configuration;
}
