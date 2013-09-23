//
// Copyright (C) Jeff Wilcox
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

module.exports = function (Context, Config) {
    var context = Context;
    var config = Config;

    var stats = {};

    var pfx = config.statistics.prefix;

    function getName(name) {
        return pfx + name;
    }

    function i(name) {
        var n = name;
        return function () {
            return stats.increment(n);
        };
    }

    // Intercept exceptions from the underlying library
    context.statsd.socket.on('error', function (exception) {
        return console.log('stats error event in socket.send(): ' + exception);
    });

    // General stats functions
    stats.increment = function statsIncrement(n) {
        if (stats.enabled) {
            context.statsd.increment(getName(n));
        }
    }

    stats.decrement = function statsDecrement(n) {
        if (stats.enabled) {
            context.statsd.decrement(getName(n));
        }
    }

    stats.enabled = config.statistics.enabled;

    // Specialized names (preferred, for the specific app)

    // Web server
    stats.server = {
        startup: i('server.startup'),
        startupFail: i('server.startupFail')
        // startupFail: function () { stats.increment('server.startupFail'); }
    };

    // Web user actions
    stats.web = {
        // signin: i('web.signin'),
        // signout: i('web.signout'),
        // signinFail: i('web.fail.signin')
    };

    // Web services
    stats.api = {
    };

    return stats;
}
