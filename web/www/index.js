//
// Copyright (C) Wilcox Digital, LLC
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

var express = require('express');

var routes = require('./routes');
var user = require('./routes/user');

var http = require('http');
var path = require('path');

var MongoStore = require('connect-mongo')(express)
  , passport = require('passport')
  , FoursquareStrategy = require('passport-foursquare').Strategy;

module.exports = function (app, context) {
	var configuration = context.configuration;

	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());

    app.use(express.session({
        secret: configuration.session.secret,
        store: new MongoStore({
            connectionString: configuration.mongo.sessionsConnectionString,
            collection: configuration.tableName.sessions
        })
    }));

    app.use(passport.initialize());
    app.use(passport.session());

	app.use(express.methodOverride());
	app.use(app.router);

	app.use(express['static'](path.join(__dirname, 'public')));

	// development only
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	} else {
		// production
		app.use(express.errorHandler());
	}

	app.get('/', routes.index);
	app.get('/users', user.list);

	// Legacy APIs.
	var legacyApi = require('../legacy-api/')(app, context);

	// TODO: Refactor how this gets brought in.

	// Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.  However, since this example does not
    //   have a database of user records, the complete Foursquare profile is
    //   serialized and deserialized.
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });

    // Use the FoursquareStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and Foursquare
    //   profile), and invoke a callback with a user object.
    passport.use(new FoursquareStrategy({
        clientID: configuration.foursquare.web.clientid,
        clientSecret: configuration.foursquare.web.secret,
        callbackURL: configuration.foursquare.web.callbackUri
    },
      function (accessToken, refreshToken, profile, done) {
          var record = {
              id: profile.id,
              name: profile.name,
              emails: profile.emails,
              oat: accessToken
          };

          var raw = done._raw;
          if (raw) {
              var json = JSON.parse(raw);
              if (json &&
                json.response &&
                json.response.user &&
                json.response.user.photo) {
                  record.photo = json.response.user.photo;
              }
          }

          return done(null, record);
      }
    ));


}
