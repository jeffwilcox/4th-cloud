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

module.exports = function(ctx, foursquareUserId) {

	var self = this;
	var context = ctx;
	this.context = context;

	var dateutil = require('./dateutil');
	var geo = require('./geo');
	var pushutil = require('./pushutil');
	var helpers = require('./helpers');
	var httputil = require('./httputil');
	var mayorlivetile = require('./mayorlivetile');

	self.removeDevice = function (uri, callback) {
		// TODO: Secure up to be user-specific...
		// TODO: Make it specific to the ID, not the uri. Let's not expose that to users.
		var mongo = context.mongo;
		if (mongo && mongo.collections && mongo.collections.clients) {
		    mongo.collections.clients.remove(
		        { uri: uri },
		        context.mongo.safe,
		        function (err, res) {
		        	callback(err, res);
		        });
		} else {
			callback( { message: 'Not initialized for removal.' } );
		}
	}

	self.getDevices = function (callback) {
		var constraints = {
			sort: { ping: -1 }
		};

		var mongo = context.mongo;
		if (mongo && mongo.collections && mongo.collections.clients) {
			mongo.collections.clients.find({ u: foursquareUserId }, constraints).toArray(function (err, res) {
			var devices = [];

			if (res && res.length) {
				for (var i = 0; i < res.length; i++) {
					var device = res[i];
					devices.push(device);
				}
			}

			callback (undefined, devices);
		});
		} else {
			callback ({ message: 'No connection to cloud data.'});
		}
	}

	return {
		'getDevices': getDevices,
		'removeDevice': removeDevice
	}
}
