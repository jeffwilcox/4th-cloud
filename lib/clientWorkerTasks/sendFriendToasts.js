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

// sendFriendToasts

module.exports = function (task) {
	return function (callback) {
		var mpns = require('mpns');
        var wns = require('wns');
		var r = task.r;
		var clientResults = task.clientResults;
		var context = task.context;

        function sendFriendCheckinToast(friendName, friendPhoto, venueName, venueId, checkinId, callback_) {
            var text = venueName;

            // TODO: Refactor out the w8-specifics, etc.
            if (r.os == 'w8') {
                // Windows 8
                var options = {
                    client_id: context.configuration.wns.clientid,
                    client_secret: context.configuration.wns.clientsecret,
                    headers: {
                        'X-WNS-RequestForStatus': 'true'
                    }
                };
                
                // OAuth2 token for the user
                if (r.wnsTok) {
                    options.accessToken = r.wnsTok;
                }

                // TODO: In the future use sendToastImageAndText02 once we have user pics, too.
                console.log('Win8 toast: ' + friendName);
                console.log('1 ' + r.uri);
                console.log('2 ' + friendName);
                console.log('3 ' + '@ ' + venueName);
                console.log('4 - options:');
                console.dir(options);

                // TODO: sendToastText02 if no image
                // wns.sendToastText02
                wns.sendToastImageAndText02(
                    r.uri,
                    friendPhoto,
                    friendName,
                    friendName,
                    '@ ' + venueName,
                    options,
//                wns.sendToastText02(
  //                  r.uri,
    //                friendName,
      //              '@ ' + venueName,
        //            options,
                    function (werr, wres) {
                        // TODO: Possible not nice experience, first toast ever could be an error (resend?)
                        currentAccessToken = werr ? werr.newAccessToken : wres.newAccessToken;
                        if (currentAccessToken != r.wnsTok && currentAccessToken !== undefined) {
                            r.wnsTok = currentAccessToken;
                            console.log('got wns token: ' + r.wnsTok);
                        }
                        callback_(werr, wres);
                    }
                    );
            } else {
                // Windows Phone 7.5
                var parameterUri = "/Views/Comments.xaml?checkin=" + checkinId;// + "&highWatermark=" + highWatermark;
                
                if (friendName.length > 21) {
                    friendName = friendName.substr(0, 20);
                }

                var toast = new mpns.toast( {
                    text1: friendName,
                    text2: '@ ' + text
                });
                // TODO: Fix or address. ASSUME! if (isMango) {
                toast.param = parameterUri;
                //}
                task.sendPushNotification(task.uri, toast, function (ce, cr) {
                    if (!ce) {
                        callback_(undefined, null);
                    } else {
                        callback_(ce, null);
                    }
                });
            }
        }

		if (task.storage.pendingFriendToasts && 
            task.storage.pendingFriendToasts.length > 0) {
            
            var myId = r.u;

            // TODO: Currently I am just sending 1 toast here, not more than that.
            var t = task.storage.pendingFriendToasts[0];

            var checkinUser = t.friend;
            var checkinVenue = t.venue;
            var checkinId = t.checkinid;
            var friendEntry = t.entry; // The Mongo entry for the user.

            var friendName = task.getFullestName(checkinUser);

            //if (context.environment.isDevelopment === true) {
            //    clientResults.log('Friend ' + friendName + ' ' + t.distance + 'km away ' + t.howLongAgo + ' min ago: ' + checkinVenue.name);
            //}

            friendEntry.cid = checkinId; // Update the ID we know about.

            context.mongo.collections.friends.findAndModify(                
                {friendid: checkinUser.id, userid: myId},
                [['_id', 'asc']], // sort
                {$set: { cid: checkinId } },
                {
                    'new': false, // no new blank entries!
                    upsert: true,
                    safe: true
                },
                function(err, obj) {
                    if(err) {
                        console.log('mongo set fail!');
                        console.dir(err);
                        callback(err, null);
                    } else {
                        // Set the document in the shared storage for use in this run.
                        task.storage.friendsTable[checkinUser.id] = friendEntry;
                        var pic = friendEntry.photo ? friendEntry.photo : 'http://tiles.4thandmayor.com/Win8ToastPrototype.png';
                        sendFriendCheckinToast(friendName, pic, checkinVenue.name, checkinVenue.id, checkinId, callback);
                    }
                });
        } else {
            callback(null, null);
        }
	}
}
