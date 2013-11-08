//var routes = require('./routes');
var express = require('express');

module.exports = function (app, context) {
	//app.use(express.logger('dev'));
    //app.use(express.methodOverride());    
    //app.use(app.router);

    var configuration = context.configuration;

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









// end of module.exports
}
