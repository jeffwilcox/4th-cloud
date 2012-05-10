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

// send any needed notification toast/s
// requestNotifications.js

module.exports = function (task) {
	return function (callback) {

		var r = task.r;
		var clientResults = task.clientResults;
		var context = task.context;

		var unreadCount = 0;
		if (task.storage.unreadCount) {
			unreadCount = task.storage.unreadCount;
		}

		// TODO: Consider taking 2-3 updates, not just 1...

        if (unreadCount > 0) {
            var fsq = require('node-foursquare')(context.foursquare.config);
            fsq.Updates.getNotifications(
                { limit: 1 },
                r.oat,
                function (err, res) {
                    if (err) {
                        clientResults.log("Getting Foursquare Updates request failed.");
                        task.clientErrors.setMinutesUntilNextTry(3); // 3 minutes sounds fine

                        callback(err, null);
                        return;
                    }
                    if (res) {
                        if (res.notifications && res.notifications.items) {
                        	task.storage.notificationResults = res;                        	
                        	callback(null, null);
                            return;
                        }
                        else {
                            clientResults.log("No .notifications or .notifications.items in the Updates response.");
                            task.clientErrors.setMinutesUntilNextTry(3);

                            callback(err, null);
                            return;
                        }
                    }
                });
        } else {
            callback(null, null);            
        }
    }
}
