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

// doLiveTile

module.exports = function (task) {
	return function (callback) {
		var querystring = require('querystring');
		var r = task.r;
		var clientResults = task.clientResults;
		var dateutil = require('../dateutil');
		var context = task.context;

		// Important note:
		// In the latest version of my implementation, this 
		// has changed quite a bit. The leaderboard is most often
		// only updated during live check-ins with the real-time
		// API.

		// This is a twice-daily alternative that should save bandwidth, too.

		// Assumes r.lp (leader ping time) is set elsewhere.

		function prepareLeaderboard() {
		    var fsq = require('node-foursquare')(context.foursquare.config);
		    fsq.Users.getLeaderboard(
		        { neighbors: 2 },
		        r.oat,
		        function (err,res) {
		        if (err) {
		            clientResults.log("Couldn't get the leaderboard from fsq.");
		            // move on anyway.
		        } else {

		        	// TODO: Sometimes these results are not sorted!

		            var leaders = [];
		            if (res && res.leaderboard && res.leaderboard.items) {
		                for (var t = 0; t < res.leaderboard.items.length; t++) {
		                    var item = res.leaderboard.items[t];
		                    if (item.user && item.scores && item.rank && item.scores.recent) {
		                        
		                        // Localization.
		                        // ---
		                        // TODO: Note that for localization to work, the "Me" 
		                        // string will need to be slightly localized.

		                        var leader = {
		                            name: item.user.relationship == 'self' ? 'Me' : item.user.firstName,
		                            rank: '#' + item.rank,
		                            score: item.scores.recent + ' pts',
		                            photo: item.user.photo,
		                            id: item.user.id
		                        };
		                        leaders.push(leader);
		                    }
		                }
		            }
		            if (leaders.length > 0) {
		                var u = 'http://www.4thandmayor.com/leaderTile.php?';
		                for (var y = 0; y < leaders.length; ) {
		                    var ldr = leaders[y];
		                    y++;

		                    u += "l" + y + "=" + querystring.escape(ldr.rank + " " + ldr.name);
		                    u += "&";
		                    u += "l" + y + "u=" + ldr.id;
		                    u += "&";
		                    u += "l" + y + "p=" + querystring.escape(ldr.photo);
		                    u += "&";
		                    u += "l" + y + "score=" + querystring.escape(ldr.score);
		                    u += "&";
		                }

		                // TODO: Consider storing this using task.storage.* instead.
		                clientResults.leaderboardImageUri = u;

		                var nextLeaderboardPingTime = dateutil.returnNewDatePlusMinutes(new Date(), context.configuration.constants.REFRESH_LEADERBOARD_MINUTES);
		                r.lp = nextLeaderboardPingTime;

		                clientResults.isDirty = true;
		            }
		        }

		        // should be ready if it worked, let's get the tile out next.
		        callback(null, null);
		    });
		}

	    var needsLeaderboardPing = true;
	    if (r.lp) {
	        var rightNow = new Date();
	        if (r.lp > rightNow) {
	            needsLeaderboardPing = false; // isn't needed.
	        }
	    }

	    if (needsLeaderboardPing) {
	    	if (context.environment.isDevelopment === true) {
				clientResults.log('[Leaderboard]');
			}
			
	        prepareLeaderboard();
	    }
	    else {
	    	// go on without leaderboard prep
	    	callback(null, null);
	    }
	}
}
