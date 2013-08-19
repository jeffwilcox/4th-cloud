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

var dateutil = require('./dateutil');

var historyTable = 'history';

var context = undefined;

module.exports = function (_context, callback) {
    var self = this;

    context = _context;
    var azure = require('azure');

    var config = context.configuration;

    var ts = azure.createTableService(
        config.azure.storageaccount,
        config.azure.storagekey);
    ts.protocol = 'https://';
    ts.port = 443;

    context.azure.tableService = ts;

    ts.createTableIfNotExists(historyTable, function (error) {
        if (error)
        {
            console.log('Could not create the Azure table: ' + historyTable);
            console.dir(error);

            callback(error, undefined);
        } else {
            callback(undefined, ts);
        }
    });

    self.addEntry = function(userid, data, callback) {
        var now = new Date();
        var nowStr = now.getTime();

        // Key is: 
        var key = userid + '.' + nowStr;

        data.PartitionKey = userid;
        data.RowKey = key;

        data.UserId = userid;       

        data.Created = { '@': { type: 'Edm.DateTime' }, '#': azure.ISO8061Date.format(now) };

        context.azure.tableService.insertEntity(
            historyTable, 
            data,
            function (err) {
                if (err) {
                    console.dir(err);
                }
                if (callback) {
                    callback(err, key);
                }
            });
    }

    return {
        addEntry: addEntry
    };
}
