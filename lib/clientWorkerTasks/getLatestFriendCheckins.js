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


// getLatestFriendCheckins

module.exports = function (task) {
	return function (callback) {
		var geo = require('../geo');
        var async = require('async');

		var r = task.r;
		var clientResults = task.clientResults;
		var context = task.context;

        var checkinsToToast = [];

        // TODO: Consider about venueless check-ins... is there an approximate lat/long foursquare provides I can use?
        if (task.storage.recentCheckins &&
            task.storage.recentCheckins.recent &&
            task.storage.friendsTable && 
            task.storage.selfCheckin && 
            task.storage.selfCheckin.venue &&
            task.storage.selfCheckin.venue.location && 
            task.storage.selfCheckin.venue.location !== null &&
            task.storage.selfCheckin.venue.location.lat &&
            task.storage.selfCheckin.venue.location.lng) {
            // Previously I'd check "sentToast" to not send duplicates.
            // Now I send dupes, that is fine.

            var myLocation = task.storage.selfCheckin.venue.location;
            var recentCheckins = task.storage.recentCheckins.recent;

            for (var idx in recentCheckins) {
                (function(){
                    var thisCheckin = recentCheckins[idx];
                    if (thisCheckin && 
                        thisCheckin.venue && 
                        thisCheckin.user && 
                        thisCheckin.user.relationship == 'friend' && // Won't show for: People you are following, self
                        thisCheckin.venue.name &&
                        thisCheckin.venue.id) {

                        var checkinUser = thisCheckin.user;
                        var checkinVenue = thisCheckin.venue;
                        var friendId = checkinUser.id;
                        var venueLocation = checkinVenue.location;
                        var friendEntry = task.storage.friendsTable[friendId];

                        if (friendEntry) {
                            if (friendEntry.ping === true) {
                                var distance = geo.greatCircleDistance(Number(myLocation.lat), Number(myLocation.lng), Number(venueLocation.lat), Number(venueLocation.lng));
                                var kmPerMile = 1.609344;
                                var milesOfInterest = 12; // 12 miles seems right-ish for now... could be use configurable, too.
                                if (kmPerMile * milesOfInterest > distance) {
                                    var checkinId = thisCheckin.id;
                                    var checkinCreated = Number(thisCheckin.createdAt);
                                    var rightNowAsUnixTime = Math.round(new Date().getTime() / 1000.0);
                                    

                                    var minutesToCareAbout = Number(task.storage.pollFrequency);
                                    ++minutesToCareAbout; // + 1 minute more.

                                    var minutesUnixTime = minutesToCareAbout * 60;
                                    if (checkinCreated > rightNowAsUnixTime - minutesUnixTime &&
                                        checkinId != friendEntry.cid) {
                                        
                                        // This is an interesting notification! RECENT and CLOSE.
                                        checkinsToToast.push({
                                            friend: checkinUser,
                                            venue: checkinVenue,
                                            checkinid: checkinId,
                                            entry: friendEntry,
                                            
                                            howLongAgo: Math.round((rightNowAsUnixTime - checkinCreated) / 60),
                                            distance: Math.round(distance)
                                        });
                                    }
                                }
                            } else {
                                // console.log('(pings are off for this friend)');
                            }
                        } else {
                            console.log('!!! No friend entry found (getLatestFriendCheckins.js)' + friendId);
                            console.dir(thisCheckin);
                            console.log('!!! end');
                        }
                    } 
                })();
            }
        } else {
            //clientResults.log('No nearby friend check-ins could be attempted as your last check-in location is not known.');
            if (!task.storage.friendsTable) {
                // clientResults.log('-friends');
                // No friends!
            } else {
                clientResults.log('-gps');

                clientResults.log('task.storage.recentCheckins:');
                clientResults.log(task.storage.recentCheckins);

                clientResults.log('task.storage.friendsTable:');
                clientResults.log(task.storage.friendsTable);

                clientResults.log('selfCheckin:');
                clientResults.log(task.storage.selfCheckin);
            }
        }

        if (checkinsToToast.length > 0) {
            task.storage.pendingFriendToasts = checkinsToToast;
        }

        callback(null, null);
	}
}
