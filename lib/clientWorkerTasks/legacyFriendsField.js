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

// remove legacy friends table - not ready for production use yet though!

module.exports = function (task) {
	return function (callback) {
		
		var r = task.r;
		var clientResults = task.clientResults;

		if (r.friends) {
			delete r.friends;

			clientResults.isDirty = true;
			clientResults.log('Removing old r.friends field from primary clients table.');

			var context = task.context;
			context.mongo.collections.clients.update(
				{uri: task.uri},
				{ $unset : { friends : 1} });			
		}

		callback(null, null);
	}
}
