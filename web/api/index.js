var routes = require('./routes');
var express = require('express');

module.exports = function (app, context) {
	app.use(express.logger('dev'));

	app.get('/', routes.index);
}
