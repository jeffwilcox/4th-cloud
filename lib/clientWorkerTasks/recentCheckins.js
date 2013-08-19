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


// get recent checkins 

module.exports = function (task) {
	return function (callback) {
		var r = task.r;
		var clientResults = task.clientResults;		
		var context = task.context;

        var oauthToken = r.oat;
        var osVersion = r.osv;
        var userId = r.u;

        var fsq = require('node-foursquare')(context.foursquare.config);

        var params = null;

        // Speeds up the requests and cuts down on data transfer.
        if (r.lastTime && r.lng && r.lat) {
            params = {
              afterTimestamp: r.lastTime
            };
        }

        function processFoursquareCheckins(err, res) {
        	if (!err && res) {
        		task.storage.recentCheckins = res;

        		callback(null, null);
        	} else {
			    if (!err) {
			    	err = "bad foursquare check-in request";
			    }

			    // 401
			    if (err.message) {
			        if (err.message.indexOf("401") == -1) {
			        	task.clientErrors.setMinutesUntilNextTry(3);
			            clientResults.log("Results from the fsq request:");
			            clientResults.log(err);
			        } else {
			            // 401: oauth token revoked/etc.
			            clientResults.log("401: OAuth Token Revoked/Invalid");
			            task.clientErrors.deleteClient = true;
			        }
			    }

	    		callback(err, null);
	    	}
        }

        fsq.Checkins.getRecentCheckins(params, 
        	oauthToken, 
        	processFoursquareCheckins);
	}
}
