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

var role = 'web';
var mode = 'production';

if (process.argv.length > 2) {
    role = process.argv[2];
}
if (process.argv.length > 3) {
    mode = process.argv[3];
}

// Windows Azure Web Sites support
if (process.env.MODE) {
    mode = process.env.MODE;
}

var port = process.env.PORT || 3000;

var path = require('path'),
	nconf = require('nconf'),
	fs = require('fs');

var filename = '4th-config';
if (mode == 'dev' || mode == 'staging') {
	filename += '.' + mode;
}
filename += '.json';

var potentialLocations = [
	'/home/ec2-user/4th-cloud/' + filename,
	'./' + filename,
	path.resolve('../4th-conf/' + filename),
	path.resolve('./' + filename)
];

var configFile = null;

for (var i in potentialLocations) {
	var fn = potentialLocations[i];
	if (fs.existsSync(fn)) {
		configFile = fn;
		break;
	}
}

if (configFile == null) {
	throw new Error('Could not resolve the JSON configuration file.');
}

console.log('Configuration file: ' + configFile);
	
nconf //.argv()
	    // .env()
	    .file('conf', { file: configFile });
	    // .file('ec2', { file: '/home/ec2-user/4th-cloud/' + filename})
	    // .file('local', { file: './' + filename})
	    // .file('conf', { file: path.resolve('../4th-conf/' + filename)});
nconf.load();
	
var Configuration = {
    role: role,
    mode: mode,

	aws: {
		id: nconf.get('aws-id'),
		secret: nconf.get('aws-secret'),
		snsArn: nconf.get('aws-sns-arn')
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
            host: nconf.get('statsd-host'),
            port: nconf.get('statsd-port')
        },
        prefix: nconf.get('stats-prefix')
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
		storagekey: nconf.get('azure-storage-key'),
		container: {
			mail: nconf.get('azure-email-container')
		}
	},

	wns: {
		clientid: nconf.get('wns-client-id'),
		clientsecret: nconf.get('wns-client-secret')
	},

	mongo: {
		connectionString: nconf.get('mongo-connection-string'),
		sessionsConnectionString: nconf.get('mongo-sessions-connection-string')
	},

	tableName: {
		clients: nconf.get('table-clients'),
		friends: nconf.get('table-friends'),
		history: nconf.get('table-history'),
		sessions: nconf.get('table-sessions')
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
		REFRESH_LEADERBOARD_MINUTES: 720 // was formerly: 45
	}
};

module.exports = Configuration;
