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

module.exports = function (task) {
	return function (callback) {

		var dateutil = require('../dateutil');		

		var r = task.r;
		var clientResults = task.clientResults;
		var context = task.context;

		var pollFrequency = task.getPollFrequency(); // task.context.configuration.poll.recent;
		task.storage.pollFrequency = pollFrequency;
		
		var newPollTime = dateutil.returnNewDatePlusMinutes(new Date(), pollFrequency);

		if (!r.c) {
			// Stores the first time ever processed by the server.
			// It is possible that the server might now handle this today... so ... need to verify!
			r.c = r.ping;
		}

		task.initialPingTime = r.ping;

		var criteria = { _id: r._id };

		if (r.v) {
			// Must match the current value on Mongo.
			criteria.v = r.v;

	        var newVersion = Number(r.v) + 1;
	        if (newVersion > 99) {
	            newVersion = 1;
	        }
	        r.v = newVersion;
		} else {
			// First time ever!
			r.v = 1;

			clientResults.log('Processing a client for the first time.');
		}

		// Set the new ping time assuming we can reserve this work.
		r.ping = newPollTime;

	    function validateClientData(data) {
	        return (
	            data.uri &&
	            data.mfg &&
	            data.av &&
	            data.cc &&
	            data.osv &&
	            data.oat &&
	            data.uri &&
	            data.ping);
	    }

		function reservationSuccess() {
			if (validateClientData(r)) {
				var data = '';
                if (r.name) {
                    data += r.u + ' ' + 
                    	r.name.substr(0,30) + ' ' + 
                    	r.mfg + ' ' + 
                    	task.storage.activityFrequency;
                }
                var tc = '';
                if (r.unreadCount === 0 || r.unreadCount ) {
                    tc = '(' + r.unreadCount + ')';
                }
                var now = new Date().getTime();
                var then = task.initialPingTime.getTime();
                var diff = now - then;
                diff = diff * 0.001; // in seconds
                var prettyDiff = Math.round(diff) + 's';
                clientResults.log(data + 
                	' uc:' + r.uc + 
                	' cc:' + r.cc + 
                	' av:' + r.av + 
                	' ' + tc + 
                	' ' + prettyDiff);
                callback(null, null);                
			} else {
				// This looks to be a bad entry or bad data.
				task.clientErrors.deleteClient = true;
				callback('Reservation OK but the client data looks bad', null);
			}
		}

		// Attempt to acquire a lock on this work.
		context.mongo.collections.clients.update(
			criteria,
			r,
			context.mongo.safe,
			function (mongoErr, mongoResult) {
				if (mongoResult != 1 || mongoErr) {
					if (mongoErr) {			
						// Complete the series with an error.
						callback({message: 'There was a data error while attempting to create a reservation for the client.',
							error: mongoErr}, null);
					} else if (mongoResult === 0) {
						// Handled by another agent.
						clientResults.isDirty = false;
						// TODO: Consider logging this fact.
						callback({ reservationHandled: true }, null);
					}
				} else {
					// We have this reservation for a minute or so.
					reservationSuccess();
				}
			});
	}
}
