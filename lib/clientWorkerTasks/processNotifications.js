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
// processNotifications.js

module.exports = function (task) {
	return function (callback) {

		var mpns = require('mpns');

		var r = task.r;
		var clientResults = task.clientResults;
		var context = task.context;

		task.reportStep('processNotifications');

		if (task.storage.notificationResults) {
			var res = task.storage.notificationResults;

	        var unreadCount = 0;
	        var existingHighWatermark = 0;
	        if (r.watermark) {
	            existingHighWatermark = r.watermark;
	        }

	        var allItems = res.notifications.items;
	        for (var i = 0; i < allItems.length; i++) {
	            var notification = allItems[i];
	            var createdAt = notification.createdAt;
	            if (createdAt > existingHighWatermark && notification.unread) {
	                if (notification.text) {
	                    clientResults.log("    Notification: " + notification.text);
	                    r.watermark = createdAt;
	                    clientResults.isDirty = true; // save when complete.

	                    var parameterUri = "/JeffWilcox.FourthAndMayor.Notifications;component/LatestNotifications.xaml";

	                    var target = notification.target;
	                    if (target && target.type) {
	                        var obj = target.object;
	                        switch (target.type) {
	                            case 'user':
	                                if (obj && obj.id && obj.firstName) {
	                                    var fullName = task.getFullestName(obj);
	                                    parameterUri = '/Views/Profile.xaml?id=' + obj.id + "&name=" + encodeURI(fullName);
	                                }
	                                break;

	                            case 'checkin':
	                                if (obj && obj.id) {
	                                    parameterUri = '/Views/Comments.xaml?checkin=' + obj.id;
	                                }

	                                break;
	                        }
	                    }

	                    var text1 = null;
	                    var text2 = notification.text;

	                    if (notification.entities && notification.entities.length && notification.entities.length > 0) {
	                        var firstEntity = notification.entities[0];
	                        if (firstEntity.indices && firstEntity.indices.length && firstEntity.indices.length > 1) {
	                            var start = firstEntity.indices[0];
	                            var end = firstEntity.indices[1];
	                            if (start === 0) {
	                                text1 = text2.slice(start, end);
	                                text2 = text2.slice(end);
	                            }
	                        }
	                    }

	                    var item = notification.target;
	                    if (item && item.type) {
	                        var ty = item.type;

	                        if (ty == 'checkin') {
	                            // TODO: Any code here?
	                        }
	                    }

                        if (text2.length && text2.length > 80) {
                        	text2 = text2.substr(0, 79);
                        }
                        var toast = new mpns.toast( {
                            text1: text1,
                            text2: text2
                        });
//	                        if (isMango) {
                        	// TODO: HARD CODING!
                        toast.param = parameterUri;
//	                        }
                        task.sendPushNotification(task.uri, toast, function (ce, cr) {
                            if (!ce) {
                                callback(undefined, null);
                            } else {
                            	callback(ce, null);
                            }
                        });

	                    return;
	                }
	            }
	        }

	        if (unreadCount > 0) {
	            // Didn't find any updates. That's not good since the unreadCount was > 0!
	            err = "The unread notification count on Foursquare is " + unreadCount + ", but there were no notification items to be found.";
	            clientResults.log(err);
	            callback(err, null);
	        } else {
	        	callback(null, null);
	        }
		} else {
			callback(null, null);
		}
	}
}
