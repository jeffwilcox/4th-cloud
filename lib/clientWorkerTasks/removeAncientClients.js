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

// remove ancient clients

module.exports = function (task) {
	return function (callback) {
		
		var r = task.r;
		var clientResults = task.clientResults;

		if (r.av && (r.av < 3.0 || r.av == '2.9.0.0')) {
			clientResults.isDirty = true;
			clientResults.log('Removing ancient user non-Mango ' + r.av);
			task.clientErrors.deleteClient = true;
			callback('ancient client non-Mango', null);
		} else {
			callback(undefined, null);
		}
	}
}
