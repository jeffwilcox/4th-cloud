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

// make sure that we have a local photo for the user

module.exports = function (task) {
	return function (callback) {
        var httputil = require('../httputil');
        var dateutil = require('../dateutil');
        var fs = require('fs');
        
		var r = task.r;
        var context = task.context;
		var clientResults = task.clientResults;

        if (context.environment.isWindows) {
            console.log('Note: Since this is Windows, the ensureLocalPhoto step is being skipped.');
        }

		if (! context.environment.isWindows &&
            task.storage.selfCheckin && 
            task.storage.selfCheckin.user && 
            task.storage.selfCheckin.user.photo) {

			var user = task.storage.selfCheckin.user;
            var photoUri = user.photo;
            var refreshPhoto = true;
		    var localMiniPhotoPath = task.context.configuration.path.temporaryPhotosDirectory + user.id + '.png';

            // Update their photo every 10 days.
            // FUTURE TODO: Replace with using file times here instead.
		    if (r.picu) {
    			var tenDaysAgo = dateutil.returnNewDateMinusMinutes(new Date(), 60 * 24 * 10);
    			if (r.picu < tenDaysAgo) {
        			clientResults.log("The user's photo is more than 10 days old, refreshing.");
                    refreshPhoto = true;
		        }
            }
            if (refreshPhoto === false && ! fs.existsSync(localMiniPhotoPath)) {
		        refreshPhoto = true;
            }
            if (refreshPhoto) {
                httputil.downloadBinaryImage(photoUri, function (err, img) {
                    if (!err && img) {
                        var im = require('imagemagick');
                        im.resize({
                            srcData: img,
                            dstPath: localMiniPhotoPath,
                            strip: false,
                            format: 'png',
                            width: context.configuration.constants.MINI_LEADERBOARD_PHOTO_SIZE,
                            height: context.configuration.constants.MINI_LEADERBOARD_PHOTO_SIZE + "^",
                            customArgs: ['-gravity', 
                                         'center',

                                         '-extent', 
                                         context.configuration.constants.MINI_LEADERBOARD_PHOTO_SIZE + 'x' + 
                                         context.configuration.constants.MINI_LEADERBOARD_PHOTO_SIZE]
                        }, function (err, stdout, stderr)
                        {
                            if (err) {
                                console.dir(err);
                                clientResults.log('Could not save mini photo.');
                            } else {
                                r.picu = new Date();
                                clientResults.isDirty = true;
                            }

// Yuck, too many callbacks!

                            callback(null, null);
                        });
        			} else {
                        clientResults.log('User profile photo download failed.');
                        clientResults.log(err);

                        // YES an "error" but this doesn't stop the overall pipeline from being able to progress.
                        callback(null, null);
                    }
                });
            } else {
            	callback(null, null);
            }
        }
        else {
        	callback(null, null);
        }
	}
}
