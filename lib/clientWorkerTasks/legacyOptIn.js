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

// legacy

module.exports = function (task) {
	return function (callback) {
		
		var r = task.r;
		var clientResults = task.clientResults;

		if (r.opt == 'in') {
			delete r.opt;
			clientResults.isDirty = true;

			var context = task.context;
			context.mongo.collections.clients.update(
				{uri: task.uri},
				{ $unset : { opt : 1} });
		}

		if (r.opt == 'beta') {
			delete r.beta;
			clientResults.isDirty = true;

			var context = task.context;
			context.mongo.collections.clients.update(
				{uri: task.uri},
				{ $unset : { beta : 1} });
		}

		if (r.opt == 'isDirty') {
			var context = task.context;
			context.mongo.collections.clients.update(
				{uri: task.uri},
				{ $unset : { isDirty : 1} });
		}

		callback(null, null);
	}
}
