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

// grab the user's own checkin entry off the list of recent checkins

module.exports = function (task) {

	return function (callback) {
		var httputil = require('../httputil');
		
		var r = task.r;
		var clientResults = task.clientResults;

		if (task.storage.recentCheckins) {
			// TODO: validate if this cR.rCO is used/needed (ported)
		    clientResults.recentCheckinsObject = task.storage.recentCheckins;
		    var res = task.storage.recentCheckins;

	        for (var checkinA in res.recent) {
			    var oneCheckin = res.recent[checkinA];
			    if (oneCheckin && oneCheckin.venue && oneCheckin.user) {
    				var user = oneCheckin.user;
			        if (user.relationship == 'self') {
			            var selfName = task.getFullestName(user);
            			if (r.name != selfName) {
                			r.name = selfName;
			                clientResults.isDirty = true;
			            }

			            // Stored! Done with this micro task.
			            task.storage.selfCheckin = oneCheckin;

			            if (oneCheckin && 
			            	oneCheckin.id &&
			            	oneCheckin.createdAt &&
			            	oneCheckin.type &&
			            	oneCheckin.type == 'checkin' &&
			            	oneCheckin.venue && 
			            	oneCheckin.venue.location && 
			            	oneCheckin.venue.location.lat && 
			            	oneCheckin.venue.location.lng) {
			            	
			            	clientResults.isDirty = true;

			            	clientResults.lat = oneCheckin.venue.location.lat;
			            	clientResults.lng = oneCheckin.venue.location.lng;
			            	clientResults.cca = oneCheckin.createdAt;
			            	clientResults.cid = oneCheckin.id;
			            }

			            callback(null, null);
			            return;
			        }
			    }
			}

			// TODO: CONSIDER: Maybe this is something the dev/admin should be notified of as a strange situation?
		}

		// Nothing to save...
		callback(null, null);
	}
}
