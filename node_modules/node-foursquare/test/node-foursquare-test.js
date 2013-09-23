var sys = require('sys'),
	express = require('express'),
	assert = require('assert'),
  log4js = require("log4js"),
  config = require('./config');

log4js.configure(config.log4js);

var logger = log4js.getLogger("node-foursquare-test"),
  Foursquare = require('./../lib/node-foursquare')(config);

function reportError(test, message) {
  logger.error(test + " :  \033[22;31mERROR: " + message + "\x1B[0m");
}

function ok(test) {
  logger.info(test + " : \033[22;32mOK\x1B[0m");
}

function TestSuite(accessToken) {
  var Tests = {
    "Users" : {},
    "Venues" : {},
    "Checkins" : {},
    "Tips" : {},
    "Lists" : {},
    "Updates" : {},
    "Photos" : {},
    "Settings" : {},
    "Specials" : {},
    "Events" : {}
  };

  Tests.Users.search = function() {
    var params = { "twitter": "naveen" },
      test = "Foursquare.Users.search(twitter=naveen)";
    
    Foursquare.Users.search(params, accessToken, function(error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.results);
          assert.equal(data.results[0].id, "33");
          assert.equal(data.results[0].firstName, "naveen");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getLeaderboard = function() {
    var test = "Foursquare.Users.getLeaderboard()";
    Foursquare.Users.getLeaderboard({}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.leaderboard);
          assert.ok(data.leaderboard.count >= 0);
          assert.ok(data.leaderboard.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getUser = function() {
    var test = "Foursquare.Users.getUser(self)";
    Foursquare.Users.getUser("self", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.user);
          assert.ok(data.user.id);
          assert.ok(data.user.firstName);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
    Foursquare.Users.getUser("33", accessToken, function (error, data) {
      var test = "Foursquare.Users.getUser(33)";
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.user);
          assert.equal(data.user.id, "33");
          assert.equal(data.user.firstName, "naveen");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getBadges = function() {
    var test = "Foursquare.Users.getBadges(self)";
    Foursquare.Users.getBadges(null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.badges);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getCheckins = function() {
    var test = "Foursquare.Users.getCheckins(self)";
    Foursquare.Users.getCheckins(null, null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.checkins);
          assert.ok(data.checkins.count >= 0);
          assert.ok(data.checkins.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getFriends = function() {
    var test = "Foursquare.Users.getFriends(self)";
    Foursquare.Users.getFriends(null, null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.friends);
          assert.ok(data.friends.count >= 0);
          assert.ok(data.friends.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getMayorships = function() {
    var test = "Foursquare.Users.getMayorships(self)";
    Foursquare.Users.getMayorships(null, null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.mayorships);
          assert.ok(data.mayorships.count >= 0);
          assert.ok(data.mayorships.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getTips = function() {
    var test = "Foursquare.Users.getTips(self)";
    Foursquare.Users.getTips(null, null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.tips);
          assert.ok(data.tips.count >= 0);
          assert.ok(data.tips.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getTodos = function() {
    var test = "Foursquare.Users.getTodos(self)";
    Foursquare.Users.getTodos(null, null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.todos);
          assert.ok(data.todos.count >= 0);
          assert.ok(data.todos.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getVenueHistory = function() {
    var test = "Foursquare.Users.getVenueHistory(self)";
    Foursquare.Users.getVenueHistory(null, null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.venues);
          assert.ok(data.venues.count >= 0);
          assert.ok(data.venues.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Users.getRequests = function() {
    var test = "Foursquare.Users.getRequests()";
    Foursquare.Users.getRequests(accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.requests);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.search = function() {
    var test = "Foursquare.Venues.search(40.7, -74)";
    Foursquare.Venues.search("40.7", "-74", {}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.venues);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.getTrending = function() {
    var test = "Foursquare.Venues.getTrending(40.7, -74)";
    Foursquare.Venues.getTrending("40.7", "-74", {}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.venues);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.getCategories = function() {
    var test = "Foursquare.Venues.getCategories()";
    Foursquare.Venues.getCategories({}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.categories);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.explore = function() {
    var test = "Foursquare.Venues.explore(40.7, -74)";
    Foursquare.Venues.explore("40.7", "-74", {}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.keywords);
          assert.ok(data.groups);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.getVenue = function() {
    var test = "Foursquare.Venues.getVenue('5104')";
    Foursquare.Venues.getVenue("5104", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.venue);
          assert.equal(data.venue.id, "40a55d80f964a52020f31ee3");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.getHereNow = function() {
    var test = "Foursquare.Venues.getHereNow('5104')";
    Foursquare.Venues.getHereNow("5104", null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.hereNow);
          assert.ok(data.hereNow.count >= 0);
          assert.ok(data.hereNow.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.getTips = function() {
    var test = "Foursquare.Venues.getTips('5104')";
    Foursquare.Venues.getTips("5104", null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.tips);
          assert.ok(data.tips.count >= 0);
          assert.ok(data.tips.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.getPhotos = function() {
    var test = "Foursquare.Venues.getPhotos('5104')";
    Foursquare.Venues.getPhotos("5104", null, null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.photos);
          assert.ok(data.photos.count >= 0);
          assert.ok(data.photos.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Venues.getLinks = function() {
    var test = "Foursquare.Venues.getLinks('5104')";
    Foursquare.Venues.getLinks("5104", null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.links);
          assert.ok(data.links.count >= 0);
          assert.ok(data.links.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Checkins.getCheckin = function() {
    var test = "Foursquare.Checkins.getCheckin(4dae3f9e4df0f639f248ca13)";
    Foursquare.Checkins.getCheckin("4dae3f9e4df0f639f248ca13", null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.checkin);
          assert.equal(data.checkin.id, "4dae3f9e4df0f639f248ca13");
          assert.equal(data.checkin.type, "checkin");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Checkins.getRecentCheckins = function() {
    var test = "Foursquare.Checkins.getRecentCheckins()";
    Foursquare.Checkins.getRecentCheckins(null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.recent);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Tips.getTip = function() {
    var test = "Foursquare.Tips.getTip(4b5e662a70c603bba7d790b4)";
    Foursquare.Tips.getTip("4b5e662a70c603bba7d790b4", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.tip);
          assert.equal(data.tip.id, "4b5e662a70c603bba7d790b4");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Lists.getList = function() {
    var test = "Foursquare.Lists.getList(4e4e804fd22daf51d267e1dd)";
    Foursquare.Lists.getList("4e4e804fd22daf51d267e1dd", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.list);
          assert.equal(data.list.id, "4e4e804fd22daf51d267e1dd");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Lists.getFollowers = function() {
    var test = "Foursquare.Lists.getFollowers(4e4e804fd22daf51d267e1dd)";
    Foursquare.Lists.getFollowers("4e4e804fd22daf51d267e1dd", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.count);
          assert.ok(data.followers);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Lists.getSuggestedVenues = function() {
    var test = "Foursquare.Lists.getSuggestedVenues(4e4e804fd22daf51d267e1dd)";
    Foursquare.Lists.getSuggestedVenues("4e4e804fd22daf51d267e1dd", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          // TODO: This is a bug in 4sq; docs say the field should be "suggestedVenues".
          assert.ok(data.similarVenues);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Lists.getSuggestedPhotos = function() {
    var test = "Foursquare.Lists.getSuggestedPhotos(4e4e804fd22daf51d267e1dd, v4bc49ceff8219c74ea97b710)";
    Foursquare.Lists.getSuggestedPhotos("4e4e804fd22daf51d267e1dd", "v4bc49ceff8219c74ea97b710", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.photos);
          assert.ok(data.photos.user);
          assert.ok(data.photos.user.count);
          assert.ok(data.photos.user.items);
          assert.ok(data.photos.others);
          assert.ok(data.photos.others.count);
          assert.ok(data.photos.others.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Lists.getSuggestedTips = function() {
    var test = "Foursquare.Lists.getSuggestedTips(4e4e804fd22daf51d267e1dd, v4bc49ceff8219c74ea97b710)";
    Foursquare.Lists.getSuggestedPhotos("4e4e804fd22daf51d267e1dd", "v4bc49ceff8219c74ea97b710", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.photos);
          assert.ok(data.photos.user);
          assert.ok(data.photos.user.count);
          assert.ok(data.photos.user.items);
          assert.ok(data.photos.others);
          assert.ok(data.photos.others.count);
          assert.ok(data.photos.others.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Updates.getUpdate = function() {
    var test = "Foursquare.Updates.getUpdate(4e4ad999ac6317362bd6b320)";
    Foursquare.Updates.getUpdate("4e4ad999ac6317362bd6b320", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.notification);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Updates.getNotifications = function() {
    var test = "Foursquare.Updates.getNotifications()";
    Foursquare.Updates.getNotifications({}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.notifications);
          assert.ok(data.notifications.count >= 0);
          assert.ok(data.notifications.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Tips.search = function() {
    var test = "Foursquare.Tips.search(lat: 40.7, lng: -74)";
    Foursquare.Tips.search("40.7", "-74", null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.tips);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Photos.getPhoto = function() {
    var test = "Foursquare.Photos.getPhoto(4d0fb8162d39a340637dc42b)";
    Foursquare.Photos.getPhoto("4d0fb8162d39a340637dc42b", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.photo);
          assert.equal(data.photo.id, "4d0fb8162d39a340637dc42b");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Settings.getSettings = function() {
    var test = "Foursquare.Settings.getSettings()";
    Foursquare.Settings.getSettings(accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.settings);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Settings.getSetting = function() {
    var test = "Foursquare.Settings.getSetting('receivePings')";
    Foursquare.Settings.getSetting("receivePings", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(typeof data.value !== "undefined");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Specials.search = function() {
    var test = "Foursquare.Specials.search(40.7, -74)";
    Foursquare.Specials.search("40.7", "-74", {}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.specials);
          assert.ok(data.specials.count >= 0);
          assert.ok(data.specials.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Events.getEvent = function() {
    var test = "Foursquare.Events.getEvent(4e173d2cbd412187aabb3c04)";
    Foursquare.Events.getEvent("4e173d2cbd412187aabb3c04", accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.event);
          assert.ok(data.event.id == "4e173d2cbd412187aabb3c04");
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Events.getCategories = function() {
    var test = "Foursquare.Events.getCategories()";
    Foursquare.Events.getCategories(null, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.categories);
          assert.ok(data.categories.length > 0);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  Tests.Events.search = function() {
    var test = "Foursquare.Events.search()";
    Foursquare.Events.search({}, accessToken, function (error, data) {
      if(error) {
        reportError(test, error.message);
      }
      else {
        try {
          logger.trace(sys.inspect(data));
          assert.ok(data.specials);
          assert.ok(data.specials.count >= 0);
          assert.ok(data.specials.items);
          ok(test);
        } catch (error) {
          reportError(test, error);
        }
      }
    });
  };

  return {
    "Tests" : Tests,
    "execute" : function(testGroup, testName) {
      for(var group in Tests) {
        if(!testGroup || (testGroup && testGroup == group)) {
          for(var test in Tests[group]) {
            if(!testName ||(testName && testName == test)) {
              var t = Tests[group][test];
              if(t && typeof(t) == "function") {
                logger.debug("Running: " + test);
                t.call(this);
              }
            }
          }
        }
      }
    }
  }
}

function testDeprecated() {
  var depConfig = require("./config").config;

  depConfig.foursquare.version = "20110101";
  depConfig.log4js.levels["node-foursquare"] = "INFO";
  depConfig.log4js.levels["node-foursquare.core"] = "WARN";
  depConfig.foursquare.warnings = "WARN";
  
  var depFoursquare =   Foursquare = require('./../lib/node-foursquare')(depConfig),
    test = "(Version 20110101, WARN) Foursquare.Venues.search(40.7, -74)";

  function run(error, data) {
    if(error) {
      reportError(test, error);
    }
    else {
      try {
        logger.trace(sys.inspect(data));
        assert.ok(data.groups);
        ok(test);
      } catch (error) {
        reportError(test, error);
      }
    }
  }

  depFoursquare.Venues.search("40.7", "-74", {}, null, function(error, data) {
    run(error, data);
    test = "(Version 20110101, ERROR) Foursquare.Venues.search(40.7, -74)",
    depConfig.foursquare.warnings = "ERROR";
    depFoursquare.Venues.search("40.7", "-74", {}, null, function(error, data) {
      run(error, data);
    });
  });
}

// Using express was just faster... *sigh*
var app = express.createServer();

app.get('/', function(req, res) {
  var url = Foursquare.getAuthClientRedirectUrl(config.clientId, config.redirectUrl);
  sys.log(url);
	res.writeHead(303, { "location": url });
	res.end();
});

app.get('/callback', function (req, res) {

  Foursquare.getAccessToken({
    code: req.query.code
  }, function (error, accessToken) {
    if(error) {
      res.send("An error was thrown: " + error.message);
    }
    else {
      res.redirect("/test?token=" + accessToken);
    }
  });
});

app.get("/deprecated", function(req, res) {
  logger.info("\n\nTesting Version + Deprecations...\n");
  testDeprecated();
  res.send('<html></html><title>Refer to Console</title><body>Testing Version + Deprecations...</body></html>');
});

app.get("/test", function(req, res) {
  var accessToken = req.query.token || null, type = "Testing with" + (accessToken ? "" : "out") + " Authorization";
  logger.info("\n\n" + type + "\n");
  TestSuite(accessToken).execute();
  res.send('<html></html><title>Refer to Console</title><body>' + type + '...</body></html>');
});

app.listen(3000);