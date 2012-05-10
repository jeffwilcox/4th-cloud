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

// storeStartedTimestamp

// make sure that we have a local photo for the user

// TODO: where are the helpers from?
// TODO: Where is processingStarted from?

module.exports = function (task) {
	return function (callback) {
		var helpers = require('../helpers');

		var r = task.r;
		var clientResults = task.clientResults;

		if (task.processingStarted) {
		    var startedAsTimestamp = helpers.dateToUnixTimestamp(task.processingStarted);
		    r.lastTime = startedAsTimestamp;
		    r.isDirty = true;
		}

		callback(null, null);
	}
}
