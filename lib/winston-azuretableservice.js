// License TBD but consider Apache 2.0 in the meantime.

// TODO: HTTPS by default please? Also how to support the 'secure' switch?
// TODO: table name function
// TODO: Support metadata/key property shortening map/dictionary look-up (level to l, computername to cn, etc.)

//
// Azure-specific keys
// ---
// account: OR environment variable AZURE_STORAGE_ACCOUNT
// accessKey: OR environment variable AZURE_STORAGE_ACCESS_KEY
//
// Table Service options
// ---
// tableService: skips creating a tableService instance and uses yours instead
//               this can make it possible to inject emulator support
// createTableIfNotExists: defaults to true
// table: the name of the table to use, defaults to logs
// partition: default, [function], fall-through string
// rowKey: [default], timestamp, uuid, epoch, [function]
// 
// Logging Preferences
// ---
// silent: true/false
// 

var   util = require('util')
    , uuid = require('uuid-js')
    , winston = require('winston')
    , azure = require('azure');

var iso8061date = azure.ISO8061Date;

// 
// Constants
var DEFAULT_TABLE_NAME = 'logs';
var DEFAULT_CREATE_TABLE_IF_NEEDED = true;
var DEFAULT_METADATA_AS_COLUMNS = true;
var WINSTON_LOGGER_NAME = 'azuretableservice';
var WINSTON_DEFAULT_LEVEL = 'info';
var DEFAULT_PARTITION_NAME = 'logs';
var DEFAULT_ROW_KEY_TYPE = 'timestamp-uuid';

exports.DatePartitionKeyFunction = function () {
	// TODO: implement.
	throw Error('Not implemented.');
}

// 
// Winston Logger for Azure Table Service
var AzureTableService = exports.AzureTableService = function (options) {
	options = options || {};

	this.name = WINSTON_LOGGER_NAME;
	this.level = options.level || WINSTON_DEFAULT_LEVEL;

	// Authentication
	if (options.tableService !== undefined) {
		this.tableService = options.tableService;
	} else {
		var acc = options.account || process.env.AZURE_STORAGE_ACCOUNT;
		var key = options.accessKey || process.env.AZURE_STORAGE_ACCESS_KEY;

		if (!acc) {
			throw new Error('Required: account or AZURE_STORAGE_ACCOUNT environment variable for the Azure storage account to use for logging.');
		}
		if (!key) {
			throw new Error('Required: accessKey or AZURE_STORAGE_ACCESS_KEY environment variable for the Azure storage account to use for logging.');
		}

		this.tableService = azure.createTableService(acc, key);
	}

	this.createTableIfNotExists = options.createTableIfNotExists || DEFAULT_CREATE_TABLE_IF_NEEDED;
	this.table = options.table || DEFAULT_TABLE_NAME;
	this.partition = options.partition || DEFAULT_PARTITION_NAME;
	this.columns = options.columns || DEFAULT_METADATA_AS_COLUMNS;
	this.rowKey = options.rowKey || DEFAULT_ROW_KEY_TYPE;

	this.hasCheckedForTable = !this.createTableIfNotExists;
}

// 
// Inherit from winston.Transport
util.inherits(AzureTableService, winston.Transport);

// 
// Row key and partition selection techniques
function getRowKey(value) {
	var key;

	if (typeof value === 'function') {
		key = value();
	} else {
		switch (value) {
			case 'timestamp-uuid':
				key = (new Date()).toISOString() + '@' + uuid.create().hex;
				break;

			case 'uuid':
				key = UUID.create().hex;
				break;

			case 'epoch':
				key = Date.now();
				break;

			case 'timestamp':
				key = (new Date()).toISOString();
				break;

			default:
				throw Error('Invalid or empty rowKey type: ' + value);
		}
	}

	return key;
}

function getPartitionKey(partition, level, msg, meta) {
	var key = partition;
	if (typeof key === 'function') {
		key = partition(level, msg, meta);
	}
	return key;	
}

function insertRow(obj, tableName, data) {
	obj.tableService.insertEntity(tableName, data, function (error){
		obj.emit(error ? 'error' : 'logged', error);
	});
}

// 
// Log
AzureTableService.prototype.log = function tableServiceLog (level, msg, meta, callback) {
	var self = this;

	if (this.silent) {
		return callback(null, true);
	}

	// From a sort order perspective this is super important - in some
	// situations at startup the sort order with row key may be more 
	// accurate than the timestamp since the timestamp may be out of 
	// order.
	var rowKey = getRowKey(this.rowKey);
	var partitionKey = getPartitionKey(this.partition, level, msg, meta);

	var data = {
		PartitionKey: partitionKey,
		RowKey: rowKey,
		Level: level,
		Message: msg
	};

	if (meta) { 
		if (this.columns) {
			for (var prop in meta) {
				var value = meta[prop];
				data[prop] = typeof value === 'object' ? JSON.stringify(value) : value;
			}
		} else {
			data.Meta = JSON.stringify(meta);
		}
	}

	if (false == this.hasCheckedForTable) {
		// Note that in simultaneous requests this could be called 
		// many times. Should be OK.
		this.tableService.createTableIfNotExists(this.table, function (error){
			self.hasCheckedForTable = true;
			if (error) {
				self.emit('error', error);				
			} else {
				insertRow(self, self.table, data);
			}
		});
	} else {
		insertRow(this, this.table, data);
	}

	// Immediate callback
	callback(null, true);
}

// 
// Add the table service to the supported Winston transports.
winston.transports.AzureTableService = AzureTableService;
