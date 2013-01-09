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

require('./lib/context').initialize(require('./lib/configuration'), function (err, context) {
    if (err || context.environment.isWebServer !== true) {
        context.stats.server.startupFail();

        var warningText = 'Unfortunately startup went badly and the context could not be prepared, or this is not a web server role.';
        context.aws.mailCriticalWarning(warningText, function (res) {
            console.dir(res);
            throw new Error(warningText);
        });
    } else {
        var webserver = require('./lib/webserver');
        var app = webserver.initialize(context);
        var port = context.configuration.hosting.port;

        app.set('port', port);
        app.listen(port);

        context.stats.server.startup();

        var msg = 'Web server is listening on port: ' + port + ' ' + app.settings.env;
        console.log(msg);
    }
});
