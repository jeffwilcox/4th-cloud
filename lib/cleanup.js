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

var context = undefined;

var dateutil = require('./dateutil');

module.exports.initialize = function (_context) {
    context = _context;
    // hacky.
}

module.exports.mongoRemovePushFromClients = function (pushUri, callback) {
    if (context.mongo.collections.clients !== null) {
        context.mongo.collections.clients.remove(
            { uri: pushUri }, 
            context.mongo.safe,
            callback);
    } else {
        context.logger.info('The clients collection is not currently open.');
        callback( { msg: 'no collection open' }, null);
    }
}

// ---------------------------------------------------------------------------
// Rolling history cleanup
// ---------------------------------------------------------------------------
module.exports.cleanupHistoryTable = function(callback) {
    var MAXIMUM_DAYS = 2; // 2 days.
    var oldDate = dateutil.returnNewDateMinusMinutes(new Date(), MAXIMUM_DAYS * 60 * 24);
    context.logger.silly('Cleaning up the history table...');

    function cleanupHistoryTableCallback(err, result) {
        if(err) {
            context.logger.warn('error trying to cleanup the history table!');
            if(result) {
                context.logger.info(result);
            }
        } else {
            if(result) {
                context.logger.info('Removed ' + result + ' history entries.');
            }
        }
        if(callback) {
            callback();
        }
    }

    context.mongo.collections.history.remove({
        c: { $lt: oldDate } // 'c' is the date/time that the history entry was created.
    }, context.mongo.safe, cleanupHistoryTableCallback);
}

// ---------------------------------------------------------------------------
// Cleanup old clients from the cloud
// ---------------------------------------------------------------------------
module.exports.cleanupOldClients = function (callback) {
    var MAXIMUM_DAYS = 14; // 21; // days
    var oldDate = dateutil.returnNewDateMinusMinutes(new Date(), MAXIMUM_DAYS * 60 * 24);

    function cleanupOldClientsCallback(err, result)
    {
        if (err) {
            console.log("error trying to cleanup!");
            if (result) console.log(result);
        } else
        {
            if (result) {
                console.log("Removed " + result + " old clients.");
            }
        }
        if (callback) callback();
    }

    // TODO: Also remove clients with cc: 0 (no check-ins)

    // June 2012: changed `ping` to `seen` for these!

    context.mongo.collections.clients.remove(
        { seen: { $lt : oldDate } },
        context.mongo.safe,
        cleanupOldClientsCallback);
}
