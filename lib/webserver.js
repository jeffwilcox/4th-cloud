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

var express = require('express')
  , MongoStore = require('connect-mongo')(express)
  , passport = require('passport')
  , FoursquareStrategy = require('passport-foursquare').Strategy
  , engine = require('ejs-locals');

var http = require('http')
  , url = require('url')
  , crypto = require('crypto')
  , path = require('path')
  , fs = require('fs')
  , querystring = require('querystring')
  , request = require('request');

var dateutil = require('./dateutil')
  , geo = require('./geo')
  , pushutil = require('./pushutil')
  , helpers = require('./helpers')
  , httputil = require('./httputil')
  , mayorlivetile = require('./mayorlivetile');

function downloadLocalImage(userId, photoUri, squareWidth, callback) {
    var localMiniPhotoPath = context.configuration.path.temporaryPhotosDirectory + userId + '.png';
    httputil.downloadBinaryImage(photoUri, function (err, img) {
        if (!err && img) {
            var im = require('imagemagick');
            im.resize({
                srcData: img,
                dstPath: localMiniPhotoPath,
                strip: false,
                format: 'png',
                width: squareWidth,
                height: squareWidth + '^',
                customArgs: ['-gravity', 'center',
                             '-extent', squareWidth + "x" + squareWidth]
            }, function (err, stdout, stderr) {
                if (callback) {
                    callback(err, stdout);
                }
            });
        } else {
            if (callback) {
                callback({ message: 'Was not able to download the profile photo.' });
            }
        }
    });
}

exports.initialize = function (context) {
    var app = express();

    var cleanup = require('./cleanup');
    cleanup.initialize(context);

    var configuration = context.configuration;

    var LIVE_TILE_SIZE = 173;
    var REFRESH_LEADERBOARD_MINUTES = 45;
    //    var// MINI_PHOTOS_DIRECTORY = context.environment.isWindows === true ? "c:\\temp\\49photos\\" : '/tmp/49photos/';

    var jeffUserId = configuration.dev.myFoursquareUserId;

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

    // TODO: Real json...
    // res.json(null);
    // res.json('do not have that', 404)
    // res.json('oops', 500)
    // res.session.destroy(function(err) { } );

    // ---------------------------------------------------------------------------
    // Express Configuration
    // ---------------------------------------------------------------------------
    app.configure(function () {
        app.engine('ejs', engine);
        
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');

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

        app.use(express['static'](__dirname + '/../public'));
    });

    app.configure('development', function () {
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function () {
        app.use(express.errorHandler());
    });

    // ---------------------------------------------------------------------------
    // Static site
    // ---------------------------------------------------------------------------
    var StaticSite = require('./www/static');
    var staticSite = new StaticSite(context);

    app.get('/', staticSite.homepage.bind(staticSite));
    app.get('/index.html', staticSite.homepage.bind(staticSite));
    app.get('/home', staticSite.homepage.bind(staticSite));

    app.get('/features', staticSite.features.bind(staticSite));
    app.get('/features/index.html', staticSite.features.bind(staticSite));

    app.get('/about', staticSite.about.bind(staticSite));
    app.get('/about/index.html', staticSite.about.bind(staticSite));
    app.get('/about/developer.html', staticSite.about.bind(staticSite));

    app.get('/privacy.html', staticSite.privacy.bind(staticSite));

    app.get('/support/index.html', staticSite.support.bind(staticSite));
    app.get('/support', staticSite.support.bind(staticSite));

    app.get('/signin', function (req, res) {
        res.render('signin',
        {
            title: 'Sign in to your Foursquare account',
            isWide: true,
            user: req.user
        });
    });

    // GET /auth/foursquare
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in Foursquare authentication will involve
    //   redirecting the user to foursquare.com.  After authorization, Foursquare
    //   will redirect the user back to this application at /auth/foursquare/callback
    app.get('/auth/foursquare',
      passport.authenticate('foursquare'),
      function (req, res) {
          // The request will be redirected to Foursquare for authentication, so this
          // function will not be called.
      });

    // GET /auth/foursquare/callback
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    app.get('/auth/foursquare/callback',
      passport.authenticate('foursquare', { failureRedirect: '/signin' }),
      function (req, res) {
          res.redirect('/experience');
      });

    app.get('/signout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // Simple route middleware to ensure user is authenticated.
    //   Use this route middleware on any resource that needs to be protected.  If
    //   the request is authenticated (typically via a persistent login session),
    //   the request will proceed.  Otherwise, the user will be redirected to the
    //   login page.
    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/signin')
    }

    app.ensureAuthenticated = ensureAuthenticated;


    // ---------------------------------------------------------------------------
    // 'My Account' Experience!
    // ---------------------------------------------------------------------------
    require('./www/routes/experience')(app, context);


    // ---------------------------------------------------------------------------
    // Save a setting for the client app
    // ---------------------------------------------------------------------------
    app.post('/v1/push/setSetting', function (req, res) {
        // https://www.4thandmayor.com/v1/push/setSetting/?uri={0}&key={1}&value={2}

        var pushUri = req.param('uri');
        var key = req.param('key');
        var val = req.param('value');

        console.log('setting: ' + key + ': ' + val);

        if (key == 'tile') {
            // TODO: Implement.
        }

        res.send('OK');
    });


    // ---------------------------------------------------------------------------
    // Foursquare real-time API
    // ---------------------------------------------------------------------------
    app.post('/v1/realTime/push', function (req, res) {
        var secret = req.param('secret');
        if (secret == configuration.foursquare.secret) {
            console.log('received a real-time push from foursquare');

            if (req.body) {
                // if application/json is set, this will be nifty.
                var body = req.body;
                if (body.checkin) {
                    // we're already parsed.
                } else {
                    body = JSON.parse(body);
                }

                var checkin = body.checkin;
                if (checkin) {
                    var id = checkin.id;
                    var user = checkin.user;

                    if (id && user && user.id) {
                        var userId = user.id;
                        var text = '';
                        if (checkin.venue && checkin.venue.name) {
                            text = checkin.venue.name;
                        }
                        console.log('real-time foursquare check-in' + text);

                        // TODO: Reset their leaderboard ping time to right now!
                        // TODO: Notify their friends if the ping time is within say 4 minutes - speeds up for 4th users.
                    }
                }
            }
        }
        res.send('{ status: "processed" }');
    });

    // TODO: Ping/un-ping updates for a URI and a friend entry.

    // ---------------------------------------------------------------------------
    // Disconnecting client channel
    // ---------------------------------------------------------------------------
    app.post('/v1/disconnect', function (req, res) {
        // https://www.4thandmayor.com/v1/disconnect/?uri={0}

        var uri = req.param('uri');
        if (uri && pushutil.isValidUri(uri)) {
            cleanup.mongoRemovePushFromClients(uri, function () {
                console.log('push notifications disconnected by the user for ' + uri);
            });
        }

        res.send('ok');
    });

    // ---------------------------------------------------------------------------
    // Windows Phone 7.5 Settings Page
    // ---------------------------------------------------------------------------
    app.get('/v1/push/settings.xaml', function (req, res) {
        // https://www.4thandmayor.com/v1/push/settings.xaml?uri=
        console.log('settings.xaml in-app');
        var client = req.param('uri');
        res.contentType('text/xml');
        s = '';
        if (context.mongo.collections.clients !== null) {
            context.mongo.collections.clients.find(
            {
                uri: client
            },
            {
                limit: 1
            }
            ).toArray(function (err, document) {
                if (err) {
                    console.dir(err);
                    s += getSimpleXamlMessage('Unfortunately the settings cannot currently be modified. ' + err);
                    res.send(s);
                } else if (document) {
                    for (var item in document) {
                        var r = document[item];

                        var userId = r.u;
                        // TODO: AZURE: Need to re-implement (refactor? abstract?) all this goo.
                        if (false && pushutil.isValidUri(client)) {
                            var nameEntry = r.name ? r.name : "friend";

                            context.mongo.collections.history.find(
                                {
                                    uri: client
                                },
                                {
                                    limit: 10, // max out at 50 or less for sure. should be pruned realistically.
                                    sort: [['c', -1]]
                                }
                            ).toArray(function (err, history) {
                                var wasError = true;
                                s = xamlStartRootTagWithXmlns('ScrollViewer');
                                s += '<StackPanel>';

                                if (history) {

                                    var mfgShown = false;

                                    if (history.length && history.length > 0) {

                                        wasError = false;

                                        s += getXamlTextBlock('Hello, ' + nameEntry + '. Push notifications are in beta testing at this time. Here are some recent attempted updates.', true);
                                    }

                                    for (var historyEntry in history) {
                                        var he = history[historyEntry];
                                        if (he && he.mfg && !mfgShown) {
                                            mfgShown = true;
                                            s += getXamlTextBlock(he.mfg, true, 'PhoneTextSmallStyle');
                                        }

                                        // TODO: Relative date/time ago.

                                        if (he.tile) {
                                            s += getXamlTextBlock("Live Tile");
                                            addPushStatusLine(he.tile, s);

                                            if (he.tile.backgroundImage) {
                                                s += '<StackPanel Orientation="Horizontal" HorizontalAlignment="Left" Margin="12,12,0,0" Height="173" Background="{StaticResource PhoneAccentBrush}">';
                                                if (he.tile.backgroundImage) {
                                                    s += '<Image Source="' + helpers.escapeAmpersands(he.tile.backgroundImage) + '" Stretch="None" Height="173" Width="173"/>';
                                                }
                                                //if (he.tile.backBackgroundImage) {
                                                //    s += '<Image Source="' + escapeAmpersands(he.tile.backBackgroundImage) + '" Stretch="None" Height="173" Width="173"/>';
                                                //}
                                                s += '</StackPanel>';
                                            }
                                        }

                                        if (he.toast) {
                                            s += getXamlTextBlock('Toast Notification');
                                            addPushStatusLine(he.toast, s);
                                            if (he.toast.text1 || he.toast.text2) {
                                                s += '<Grid Height="30" Margin="12,12,0,0" HorizontalAlignment="Stretch" Background="{StaticResource PhoneAccentBrush}">';
                                                s += getXamlTextBlock(he.toast.text1 + ' ' + he.toast.text2);
                                                s += '</Grid>';
                                            }
                                        }
                                    }
                                }

                                if (wasError) {
                                    s += getXamlTextBlock('Hello, ' + nameEntry + '. The notification system is currently unavailable or having issues.', true);
                                }

                                s += '</StackPanel></ScrollViewer>';
                                res.send(s);

                                console.log(s);

                                return;
                            });
                        }
                        else {
                            s += getSimpleXamlMessage("You don't seem to be using a registered or valid phone at this time for push notifications to work.");
                            res.send(s);
                        }

                        return; // finished.
                    }
                }
            });
        } else {
            s += getSimpleXamlMessage("There's a communication problem currently, please try checking these push settings later.");
            res.send(s);
        }
    });

    // ---------------------------------------------------------------------------
    // Client Connection by the app
    // ---------------------------------------------------------------------------
    app.post('/v1/connect', function (req, res) {
        var document = {
            uri: req.param('uri'),          // Push URI
            oat: req.param('oat'),          // OAuth Token
            u: req.param('u'),              // Foursquare user ID
            apv: req.param('apv'),          // App Platform version
            av: req.param('av'),            // App version
            cc: req.param('cc'),            // Checkin count
            uc: req.param('uc'),            // Use count
            mfg: req.param('mfg'),          // Phone manufacturer
            os: req.param('os') || 'wp',    // Operating system (not provided before Windows Store)
            osv: req.param('osv'),          // Operating system version
            seen: new Date(),               // Last seen! Can use this to clear out old entries.
            ping: new Date()                // Last ping time (was "c" previously)

            // poll: TBD. If there isn't a poll entry, it should be now + 5 minutes...
            // fp: first processed
        };

        if (context.mongo.collections.clients !== null) {
            context.mongo.collections.clients.findAndModify(
                { uri: req.param('uri') }, // query
                [['_id', 'asc']], // sort
                {$set: document },
                {
                    'new': true,
                    upsert: true,
                    safe: true
                },
                function (err, obj) {
                    if (err) {
                        console.warn(err);
                    }
                    var extra = '';
                    if (obj && obj.mfg && obj.u && obj.osv) {
                        extra += ' ' + obj.mfg + ' ' + obj.u + ' ' + obj.osv;
                    }

                    context.winston.info('Push connect: ' + extra);
                    // TODO: Send statistics ping, too.

                    res.send('ok');
                });
        }
        else {
            context.winston.warning('mongoClientsCollection is not initialized yet.');

            // TBD: Consider storing a queue of these to process when the database
            // connection can be restored!

            res.send('bad');
        }
    });

    // ---------------------------------------------------------------------------
    // Push Status
    // ---------------------------------------------------------------------------
    app.get('/v1/push/status.html', function (req, res) {
        // https://www.4thandmayor.com/v1/push/status.html?uri={0}
        context.winston.info('Status.html request'); // CONSIDER: Move to 'silly'.

        res.contentType('text/html');
        res.send('<html><body>Push notifications work sometimes. Tweet to @4thandmayor for assistance.</body></html>');
    });

    // ---------------------------------------------------------------------------
    // Tile Image Resizing
    // ---------------------------------------------------------------------------
    app.get('/tile.php', function (req, res) {
        // TODO: Offload to dedicated graphics cloud.
        var original = req.param("i");
        if (original) {
            context.winston.info('live tile resize processed');

            httputil.downloadBinaryImage(original, function (err, img) {
                if (!err && img) {
                    var im = require('imagemagick');
                    im.resize({
                        srcData: img,
                        strip: false,
                        width: LIVE_TILE_SIZE,
                        height: LIVE_TILE_SIZE + '^',
                        customArgs: ['-gravity', 'center',
                                     '-extent', LIVE_TILE_SIZE + 'x' + LIVE_TILE_SIZE]
                    }, function (err, stdout, stderr) {
                        if (err) {
                            console.log(err);
                            console.log(stderr);
                            redirectToStandardTile(res);
                        } else {
                            res.contentType('image/jpeg');
                            res.end(stdout, 'binary');
                        }
                    });
                } else {
                    redirectToStandardTile(res);
                }
            });
        } else {
            redirectToStandardTile(res);
        }
    });

    // ---------------------------------------------------------------------------
    // Leaderboard Tile
    // ---------------------------------------------------------------------------
    app.get('/leaderTile.php', function (req, res) {
        var leaders = [];
        var leaderImagesToDownload = [];
        for (var i = 1; i < 4; i++) {
            var prefix = "l" + i;
            var nameLine = req.param(prefix);
            if (nameLine) {
                var userId = req.param(prefix + 'u');
                var score = req.param(prefix + 'score');
                var userPhoto = req.param(prefix + 'p');
                if (userId && score) {
                    var newLeader = { u: userId, s: score, n: nameLine };
                    if (fs.existsSync(context.configuration.path.temporaryPhotosDirectory + userId + '.png')) {
                        leaders.push(newLeader);
                    } else if (userPhoto) {
                        newLeader.sourceUri = userPhoto;
                        leaderImagesToDownload.push(newLeader);
                    }
                }
            }
        }

        function downloadNeededImages() {
            if (leaderImagesToDownload.length > 0) {
                var toGet = leaderImagesToDownload.pop();
                downloadLocalImage(toGet.u,
                    toGet.sourceUri,
                    context.configuration.constants.MINI_LEADERBOARD_PHOTO_SIZE,
                    function (err, ok) {
                        if (err) {
                            // Could not save. That's OK, move on.
                            context.winston.warning('Could not save a mini image from the web.', {error: err});
                        } else {
                            context.winston.info('Downloaded a small image locally for ' + toGet.u);
                            if (fs.existsSync(context.configuration.path.temporaryPhotosDirectory + toGet.u + '.png')) {
                                leaders.push(toGet);
                            }
                        }
                        downloadNeededImages(); // continue or move on.
                    });
            } else {
                postProcessLeaders();
            }
        }

        downloadNeededImages(); // will move on after that.

        function postProcessLeaders() {
            if (leaders.length > 0) {
                console.log('leaderboard tile');

                var customArgs = ['-gravity',
                                  'northwest',
                //,"-extent"
                                  '-size', // NEW!
                                  LIVE_TILE_SIZE + 'x' + LIVE_TILE_SIZE];

                // Add leaders to the board.
                for (var i = 0; i < leaders.length; i++) {
                    var leader = leaders[i];

                    // Leader rank and name.
                    customArgs.push('-font');
                    customArgs.push('./misc/SegoeWP-Bold.ttf');

                    customArgs.push('-fill');
                    customArgs.push('white');

                    customArgs.push('-pointsize');
                    customArgs.push('18');

                    customArgs.push('-draw');
                    customArgs.push(
                        'translate 62,' +
                        (4 + (55 * i)) +
                        ' text 0,0 ' +
                        "'" +
                        leader.n +
                        "'" +
                        '');

                    // Points.
                    customArgs.push('-font');
                    customArgs.push('./misc/SegoeWP-Semilight.ttf');

                    customArgs.push('-fill');
                    customArgs.push('white');

                    customArgs.push('-pointsize');
                    customArgs.push('24');

                    customArgs.push('-draw');
                    customArgs.push(
                        'translate 62,' +
                        (24 + (55 * i)) +
                        ' text 0,0 ' +
                        "'" +
                        leader.s +
                        "'" +
                        '');

                    // Small photo.
                    customArgs.push('-draw');
                    customArgs.push(
                        'image Over 6,' +
                        (6 + (55 * i)) +
                        ' ' +
                        '0,0' +
                        ' ' +
                        "'" +
                        context.configuration.path.temporaryPhotosDirectory +
                        leader.u +
                        ".png" +
                        "'" +
                        '');
                }
                var im = require('imagemagick');
                im.resize(
                    {
                        srcPath: 'xc:transparent',
                        format: 'png',
                        width: LIVE_TILE_SIZE,
                        height: LIVE_TILE_SIZE + '^',
                        customArgs: customArgs
                    }, function (err, stdout, stderr) {
                        if (err) {
                            console.log(err);
                            console.log(stderr);
                            redirectToStandardTile(res);
                        } else {
                            res.contentType('image/png'); // ? or jpeg ?
                            res.end(stdout, 'binary');
                        }
                    });
            } else {
                redirectToStandardTile(res);
            }
        }
    });

    return app;
}

// ---------------------------------------------------------------------------
// XAML Settings Page (in-app)
// ---------------------------------------------------------------------------
function addPushStatusLine(item, s) {
    if (item.deviceConnectionStatus) {
        s += getXamlTextBlock('Connection: ' + item.deviceConnectionStatus);
    }
    if (item.notificationStatus) {
        s += getXamlTextBlock('Notification: ' + item.notificationStatus);
    }
    if (item.subscriptionStatus) {
        s += getXamlTextBlock('Subscription: ' + item.subscriptionStatus);
    }
}

function xamlStartRootTagWithXmlns(elementName, margin) {
    if (margin === undefined) {
        margin = "0,12,0,24";
    }
    var s = '<' + elementName + ' xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml" xmlns:d="http://schemas.microsoft.com/expression/blend/2008" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"';
    s += ' xmlns:jw="clr-namespace:JeffWilcox.Controls;assembly=Shared" mc:Ignorable="d"';
    s += ' Margin="' + margin + '">';
    return s;
}

function getSimpleXamlMessage(message, useAccentBrush) {
    var s = xamlStartRootTagWithXmlns("StackPanel");
//    var s = '<StackPanel xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml" xmlns:d="http://schemas.microsoft.com/expression/blend/2008" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"';
  //  s += ' xmlns:jw="clr-namespace:JeffWilcox.Controls;assembly=Shared" mc:Ignorable="d"';
    //s += ' Margin="0,12,0,24">';

    s += getXamlTextBlock(message, useAccentBrush);

    s += '</StackPanel>';

    return s;
}

function getXamlTextBlock(text, useAccentBrush, style) {

    if (style === undefined) {
        style = 'PhoneTextNormalStyle';
    }

    var s = '';
    s += '<TextBlock TextWrapping="Wrap" VerticalAlignment="Top"';
    s += ' Text="';
    s += text;
    s += '"';
    s += ' Style="{StaticResource ';
    s += style;
    s += '}"';

    if (useAccentBrush === true) {
        s += ' Foreground="{StaticResource PhoneAccentBrush}"';
    }
    s += '/>';
    return s;
}

function redirectToStandardTile(res) {
    res.redirect('http://www.4thandmayor.com/app/genericTile.png');
}
