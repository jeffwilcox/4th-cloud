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

module.exports = function(ctx) {

	var context = ctx;

	var async = require('async');

	var dateutil = require('./dateutil');
	var geo = require('./geo');
	var pushutil = require('./pushutil');
	var helpers = require('./helpers');
	var httputil = require('./httputil');
	var mayorlivetile = require('./mayorlivetile');

	function saveHistoryEntry(hist) {
		// TODO: AZURE: Moving to Windows Azure.
	    // if (context.mongo.collections.history) {
    	//    context.mongo.collections.history.insert(hist);
	    //}
	}

	function executeTask(finalTaskCallback) {
		var pushUri = this.uri;
		this.r = this.doc;

		this.context = context;

		this.clientResults = {
			textLog: [],
			log: function (text) {
				this.textLog.push(text);
			},
			history: {},
			showLog : function () {
	            for (var i = 0; i < this.textLog.length; i++) {
	                var item = this.textLog[i];
	                if (item === undefined) {
	                    console.log();
	                } else {
	                    console.log(this.textLog[i]);
	                }
	            }
        	},
			isDirty: false // whether to save back the resulting document when done.
		};

		this.storage = {};

	    this.clientErrors = {
	        minutesUntilNextTry : 0,
    	    deleteClient : false,
        	setMinutesUntilNextTry : function (minutes) {
            	if (minutes > this.minutesUntilNextTry) {
            		// TODO: log with warn
	                this.minutesUntilNextTry = minutes;
            	}
        	}
    	};

    	var thisTask = this;

    	this.getFullestName = function (user) {
	        if (typeof user.lastName == "undefined") {
	            return user.firstName;
	        }
	        return user.firstName + (user.lastName !== null ? ' ' + user.lastName : '');
	    }

	    this.reportStep = function (step) {
	    	if (thisTask.context.environment.isDevelopment) {
	    		console.log('Step: ' + step);
	    	}
	    }

		this.getPollFrequency = function () {
			var r = thisTask.r;
            var prop = 'oldest';
			if (r.seen) {
			    var now = new Date().getTime();
                var then = r.seen.getTime();
                var diff = now - then;
                diff /= 1000;
                diff /= 60;
                diff /= 60;
                diff /= 24;

                if (diff < 2) {
                	prop = 'active';
                } else if (diff < 3.5) {
                	prop = 'recent';
                } else if (diff < 7) {
                	prop = 'week';
                } else if (diff < 13) {
                	prop = 'older';
                }
            }            
            thisTask.storage.activityFrequency = prop;
            return context.configuration.poll[prop];
		}

	    // TODO: Refactor, can remove pushUri since we already have thisTask.uri
	    this.sendPushNotification = function (pushUri, instance, thisCallback) {
		    instance.send(pushUri, function (err1, res1) {
		        var resultObject = err1 ? err1 : res1;
		        // TODO: Need to update history to be able to support multiple notifs. in history per type.
		        if (resultObject.pushType == 'tile') {
		            thisTask.clientResults.history.tile = resultObject;
		        } else if (resultObject.pushType == 'toast') {
		            thisTask.clientResults.history.toast = resultObject;

		            // TODO: Temporarily showing the toast in the results.
		            thisTask.clientResults.log(
		            	(resultObject.text1 ? resultObject.text1 : '') + 
		            	' ' + 
		            	(resultObject.text2 ? resultObject.text2 : ''));
		        }
		        // TODO: WHY? COMMENTING OUT for now: thisTask.clientResults.isDirty = true;

		        if (err1) {
		        	err1.wasPushError = true; // This is a standard thing that happens.

		            if (err1.shouldDeleteChannel === true) {
		                if (context.configuration.logging.deletes === true) {
		                	thisTask.clientResults.log('The subscription channel should be removed.');
		            	}
		                thisTask.clientErrors.deleteClient = true;
		            }
		            else if (err1.minutesToDelay) {

		            	// 61 minutes is the official Microsoft number
		            	// Doesn't mean that I need to respect it!
		            	if (err1.minutesToDelay == 61) {
		            		err1.minutesToDelay = 6;
		            	}

		                thisTask.clientErrors.setMinutesUntilNextTry(err1.minutesToDelay);
		            }
		        } else {
		        	if (context.configuration.logging.notificatioDetails === true) {
		            	thisTask.clientResults.log('<< ' + resultObject.pushType.toUpperCase() + ' >> sent');
		        	}
		        }

		        if (resultObject.deviceConnectionStatus && context.configuration.logging.pushHeaders === true) {
		            thisTask.clientResults.log(resultObject.deviceConnectionStatus +
		    	        ' ' +
			            resultObject.notificationStatus +
			            ' ' + 
			            resultObject.subscriptionStatus);
		        }

		        if (thisCallback) {
		            thisCallback(err1, res1);
		        }
		    });
		}
    	// -------

    	this.processingStarted = new Date();

		// The complete series logic for a single client worker request. 
		// If any function has an error, there is a shortcut and any
		// final processing is done at that time.
		async.series({
			reservation: require('./clientWorkerTasks/workerReservation')(this),

			removeNonMangos: require('./clientWorkerTasks/removeAncientClients')(this),

			legacyRemoveOptIns: require('./clientWorkerTasks/legacyOptIn')(this),
			legacyWarningRem: require('./clientWorkerTasks/removeUpgradeWarnings')(this),
			legacyFriendsField: require('./clientWorkerTasks/legacyFriendsField')(this),

			getRecentCheckins: require('./clientWorkerTasks/recentCheckins')(this),
			getUnreadCount: require('./clientWorkerTasks/getUnreadCount')(this),

			getSelf: require('./clientWorkerTasks/getSelf')(this),
			getFriendsIdArray: require('./clientWorkerTasks/getFriendsIdArray')(this),
			learnFriends: require('./clientWorkerTasks/learnFriends')(this),
			
			// ensureLocalPhoto: require('./clientWorkerTasks/ensureLocalPhoto')(this),

			storeStartedTimestamp: require('./clientWorkerTasks/storeStartedTimestamp')(this),

			doLiveTile: require('./clientWorkerTasks/doLiveTile')(this),
			sendLiveTile: require('./clientWorkerTasks/sendLiveTile')(this),

			requestNotifications: require('./clientWorkerTasks/requestNotifications')(this),
			processNotifications: require('./clientWorkerTasks/processNotifications')(this),

			getLatestFriendCheckins: require('./clientWorkerTasks/getLatestFriendCheckins')(this),
			sendFriendToasts: require('./clientWorkerTasks/sendFriendToasts')(this),

			sendUpgradeWarning: require('./clientWorkerTasks/sendUpgradeWarning')(this)
		},

		function (err, results) {
			if (err) {
				if (err.wasPushError && err.wasPushError === true) {
					// ignore
				} else {
					if (context.configuration.logging.errors === true) {
						console.log('Errors happened:');
						console.dir(err);
						console.log('');
					}
				}
			}

			// Special case for concurrent push agents working hard.
			if (err && err.reservationHandled) {
				if (context.configuration.logging.reservationHandles === true) {
					console.log('-reservation handled-');
				}

				finalTaskCallback();
				return;
				// ^^^^ shortcut.
			}

			var clientResults = thisTask.clientResults;
			var r = thisTask.doc;
			var clientErrors = thisTask.clientErrors;

			if (clientErrors.deleteClient === true) {
				if (context.configuration.logging.deletes === true) {
					context.winston.info('Removing client (deleteClient set)');
				}

			    context.mongo.collections.clients.remove(
			        { uri: pushUri },
			        context.mongo.safe,
			        function (err, res) {
			        	finalTaskCallback();
			        });
			    return; // ^^ shortcut
			}

			if (clientErrors.minutesUntilNextTry > 0) {
				if (thisTask.storage.pollFrequency && thisTask.storage.pollFrequency > clientErrors.minutesUntilNextTry) {
					// Do nothing, this is already longer!
				} else {
            		if (context.configuration.logging.delays === true) {
            			clientResults.log('+++ ' + clientErrors.minutesUntilNextTry + ' m');
            		}
        			r.ping = dateutil.returnNewDatePlusMinutes(new Date(), clientErrors.minutesUntilNextTry); //, minutes);
        			clientResults.isDirty = true;
        		}
			}

			var hist = clientResults.history;
			if (hist && (hist.toast || hist.tile || err)) {
				hist.ok = (err == null);
				hist.log = clientResults.textLog;
				hist.c = new Date();
				hist.uri = pushUri;
				hist.u = r.u;
				if (r.mfg) {
					hist.mfg = r.mfg;
				}
				saveHistoryEntry(hist);
			}

			if (clientResults && clientResults.log) {
				if (clientResults.rateLimitRemaining) {
					// clientResults.log('Remaining rate limit: ' + clientResults.rateLimitRemaining);
				}

				//if (context.environment && context.environment.isDevelopment) {
					clientResults.showLog();
					// console.log('');
				//}
			} else {
				console.log('no client results log??');
			}

			// Write the new client data to Mongo
			if (clientResults.isDirty === true) {
				// NOTE: The original implementation would wait for this success before logging history.
				if (r.isDirty) {
					delete r.isDirty;
				}
				context.mongo.collections.clients.update(
            		{ _id: r._id },
            		r,
            		context.mongo.safe,
            		finalTaskCallback);
			} else {
				finalTaskCallback();
			}
		});
	}

	function createTask(pushUri, resultsDocument /* Mongo document */) {
		var task = {
			name: 'clientWorkerTask: ' + pushUri,
			execute: executeTask,
			uri: pushUri,
			doc: resultsDocument
		};

		return task;
	}

	return {
		'createTask': createTask
	}
}
