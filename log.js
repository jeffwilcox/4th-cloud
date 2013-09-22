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

var   util = require('util')
    , uuid = require('uuid-js')
    , azure = require('azure');

// node log.js log dev

var partition = 'logs';
var table = 'logs';

var interval = 1000 * 2;

var iso8061date = azure.ISO8061Date;

var now = new Date();

require('./lib/configuration')(function (config) {
    require('./lib/context').initialize(config, function (err, context) {
        if (err) {
            console.dir(err);
            return;
        }
        
        var config = context.configuration;

        var tableService = azure.createTableService(config.azure.storageaccount, config.azure.storagekey);

        tableService.createTableIfNotExists(table, query);

        function query() {
            var previous = now;
            now = new Date();

            var query = azure.TableQuery
                .select()
                .from(table)
                .where('PartitionKey eq ?', partition)
                .and('Timestamp gt datetime?', iso8061date.format(previous));

            tableService.queryEntities(query, function (error, entities) {
                if (error) {
                    console.log('error returned by queryEntities:');
                    console.dir(error);
                } else {
                    for (var i in entities) {
                        var e = entities[i];
                        if (e.Level && e.Message) {
                            console.log(e.Level + ': ' + e.Message);
                        } else {
                            console.log(e);
                        }
                    }
                }
            });
        }

        setInterval(query, interval);
    });
});
