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

module.exports = function (task) {
	return function (callback) {
		var r = task.r;
		var clientResults = task.clientResults;

		function doWarning() {
			// TODO: Support an embedded web browser IN my app starting in 3.4 or so for showing pages?
			var mpns = require('mpns');
			var toast = new mpns.toast( {
                text1: 'Marketplace update',
                text2: '4th and Mayor - update to 3.3 now!'
            });
            task.sendPushNotification(task.uri, toast, function (ce, cr) {
                if (!ce) {
                    console.log('Sent an upgrade reminder toast!');
                    
					r.upgradeWarned = new Date();
					clientResults.isDirty = true;
					clientResults.log('Sending an upgrade warning for ' + r.av);

                    callback(undefined, null);
                } else {
                    callback(ce, null);
                }
            });
		}

		if (r.av && r.av < '3.3') {
			if (r.upgradeWarned) {
				// have already warned. should be a date.
				// TODO: Warn once every day ? Write this logic!
			} else {
				// Let's toast to their old version!
				doWarning();
				return;
			}
		}

		callback(null, null);
	}
}
