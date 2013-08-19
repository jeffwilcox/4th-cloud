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


// learn friends

module.exports = function (task) {

    var context = task.context;     
    var r = task.r;
    var myId = r.u;
    var clientResults = task.clientResults;

    var dateutil = require('../dateutil');

	return function (callback) {        

        if (context.environment.isStaging === true) {
            console.log('learning friends');
        }

        if (task.storage && !task.storage.friendsIdList) {
            console.log('no recent check-ins at all');
            callback(null, null); // no recent check-ins at all.
            return;
        }
        if (!myId) {
            console.log('no myID');
            callback(null, null);
            return;
        }
        if (task.storage && task.storage.friendsIdList.length == 0) {
            console.log('not enough friends');
            callback(null, null); // not enough friends
            return;
        }

        // console.log('i guess i have friends');

        // 1. We have a local list of the friend IDs who have recent check-in data.
        var fids = task.storage.friendsIdList;

        // 2. We have a table of friends of the user with various pieces of data.
        var search = { userid : myId };

        task.storage.friendsTable = {};

        context.mongo.collections.friends.find(search).toArray(function (err, res) {
            if (err) {
                console.log('err! friends table search!');
                console.dir(err);
                callback(err, null);
                return;
            }

            for (var idx in res) {
                var entry = res[idx];
                if (entry.friendid) {
                    task.storage.friendsTable[entry.friendid] = entry;
                } else {
                    console.log('invalid friend row: ');
                    console.dir(entry);
                }
            }

            step4();
        });

        // 3. If not in the local list, remove the row.
        // X ! Not for now...

        // 4. If not in the table but IN local list, add the row and get ping data.
        function updateFriendPingFromFoursquare(friendid, friendEntry, callit) // actual entry in mongo
        {
            var fsq = context.foursquare.create();            
            fsq.Users.getUser(friendid, r.oat, function (err,res) {
                // console.log('getting details on: ' + friendid);

                if (err) {
                    callit(err, null);
                } else {
                    if (res && res.user) {                        
                        // pings aren't always reported by foursquare when false.
                        var pingThisFriend = res.user.pings === true;
                        if (res.rateLimitRemaining) {
                            clientResults.rateLimitRemaining = res.rateLimitRemaining;
                        }

                        var oldPingValue = ! pingThisFriend;
                        if (friendEntry && friendEntry.ping) {
                            oldPingValue = friendEntry.ping;
                        }

                        friendEntry.pu = new Date();

                        if (pingThisFriend != oldPingValue) {
                            if (friendEntry.ping) {
                                clientResults.log("Ping value changed for friend #" + friendid + ": " + pingThisFriend);
                            } // else this is the first time ever checked.

                            friendEntry.ping = pingThisFriend;
                        }

                        // how to handle the no-_id set code?
                        if (friendEntry._id) {
                            delete friendEntry._id;
                        }

                        // store their photo uri for windows 8 use
                        if (res.user && res.user.photo) {
                            friendEntry.photo = res.user.photo;
                        }

                        context.mongo.collections.friends.findAndModify(
                            { userid: myId, friendid: friendid }, // query
                            [['_id', 'asc']], // sort
                            {$set: friendEntry },
                            {
                                'new': true,
                                upsert: true,
                                safe: true
                            },
                            function(err, obj) {
                                if(err) {
                                    console.log('mongo set fail!');
                                    console.dir(err);
                                }

                                // Set the document in the shared storage for use in this run.
                                task.storage.friendsTable[friendid] = friendEntry;

                                callit(err, null);
                            });
                    } else {
                        // Not enough data!
                        console.log('updateFriendPing info, not enough data was in the response...');

                        // NOTE: Not erroring out for now!
                        callit(null, null);
                    }
                }
            });
        }

        function ensureFriendData(friendid, efdCallback) {
            var needsUpdate = false;
            var doc = { 
                userid: myId,
                friendid: friendid };

            if (task.storage.friendsTable[friendid]) {
                doc = task.storage.friendsTable[friendid];
                needsUpdate = !(doc.ping && doc.pu);
                var lastChecked = doc.pu; // ping last checked
                if (lastChecked) {
                    var oneDayAgo = dateutil.returnNewDateMinusMinutes(new Date(), 60 * 24);
                    if (lastChecked < oneDayAgo) {
                        // Need to update this entry!
                        needsUpdate = true;
                    }
                }
            } else {
                // Create.
                needsUpdate = true;
            }

            if (needsUpdate) {
                updateFriendPingFromFoursquare(friendid, doc, efdCallback);
            } else {
                efdCallback();
            }
        }

        function step4() {
            var async = require('async');
            var steps = [];
            for (var fid in fids) {
                (function() {
                    var id = fids[fid];
                    steps.push(function (cbk) {
                        ensureFriendData(id, cbk);
                    });
                })();
            }
            async.parallel(steps, function (err, res) {
                callback(err, res);
            });
        }
	}
}
