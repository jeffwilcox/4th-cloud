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

// create an array of all the friends that the user has that show up in
// the checkins data from foursquare

module.exports = function (task) {
	return function (callback) {
		var r = task.r;
		var clientResults = task.clientResults;
	    var friendsIdList = [ ];
		if (task.storage.recentCheckins) {
			var res = task.storage.recentCheckins;
	        for (var checkinA in res.recent) {
			    var oneCheckin = res.recent[checkinA];
			    if (oneCheckin && oneCheckin.venue && oneCheckin.user) {
    				var user = oneCheckin.user;
			        if (user.relationship !== 'self') {
		                var friendId = user.id;
		                if (friendId) {
		                    friendsIdList.push(friendId);
		                }        	
			        }
			    }
			}

			if (friendsIdList.length > 0) {
				task.storage.friendsIdList = friendsIdList;
			}
		}

		callback(null, null);
	}
}
