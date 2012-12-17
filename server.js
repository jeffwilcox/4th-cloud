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
// ---------------------------------------------------------------------------
// 4th & Mayor Web Site
// ---------------------------------------------------------------------------

var StatsD = require('node-statsd').StatsD;
c = new StatsD('statsd.4thandmayor.com', 8125); // Yes, a global.

require('./lib/context').initialize(require('./lib/configuration'), function (err, context) {
    if (err || context.environment.isWebServer !== true) {
        context.statsd.increment('dev.4thandmayor.com.failed_server_startup');
        throw new Error('Unfortunately startup went badly and the context could not be prepared, or this is not a web server role.');
    } else {
        var webserver = require('./lib/webserver');
        var app = webserver.initialize(context);
        var port = context.configuration.hosting.port;

        app.set('port', port);
        app.listen(port);

        context.statsd.increment('dev.4thandmayor.com.node_startup');

        console.log('Web server is listening on port: ' + port + ' ' + app.settings.env);
    }
});
