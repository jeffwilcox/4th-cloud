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

// sendLiveTile

module.exports = function (task) {
	return function (callback) {
		var mayorlivetile = require('../mayorlivetile');
		var mpns = require('mpns');

		var r = task.r;
		var clientResults = task.clientResults;
		var context = task.context;

		var unreadCount = 0;
		if (task.storage.unreadCount) {
			unreadCount = task.storage.unreadCount;
		}

	    if (unreadCount != r.unreadCount || clientResults.leaderboardImageUri) {
	        var tile = unreadCount > 0 ? mayorlivetile.getNotificationCountTileUri(Number(unreadCount))
	                                   : mayorlivetile.getNotificationCountTileUri(null);
	        var isLiveTileEnabled = true;

	        // not in windows 8 for now
	        if (r.os == 'w8') {
	        	isLiveTileEnabled = false;
	        }

	        // TODO: If they have picked a 'static' or a 'classic' icon, don't live tile them!

	        if (r.luri != clientResults.leaderboardImageUri) {
	            r.luri = clientResults.leaderboardImageUri;
	            clientResults.isDirty = true;
	        }

	        if (isLiveTileEnabled) {
	            var newTile = new mpns.liveTile( {
	                title: '4th & Mayor',
	                backgroundImage: tile
	            });
	            var isMango = true; // NOTE: HARD CODED!
	            if (isMango) {
	                newTile.backBackgroundImage = r.luri;
	            }

	            task.sendPushNotification(task.uri, newTile, function (ce, cr) {
	                if (!ce) {
	                    r.unreadCount = unreadCount;
	                    clientResults.isDirty = true;
	                    clientResults.log('New Tile: [' + unreadCount + ']');
	                    callback(null, null);
	                } else {
	                	callback(ce, null);
	                }
	            });
	        } else {
	        	callback(null, null);
	        }
	    } else {
	    	// no tile to send. move on.
	    	callback(null, null);
	    }
	}
}
