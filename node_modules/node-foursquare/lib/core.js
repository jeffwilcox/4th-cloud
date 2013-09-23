var exports = module.exports,
  qs = require('querystring'),
  sys = require("sys"),
  https = require('https'),
  urlParser = require('url'),
  emptyCallback = function() { };

/**
 * Construct the Core module.
 * @param {Object} config A valid configuration.
 */
module.exports = function(config) {

  var log4js = require("log4js");

  log4js.configure(config.log4js);
  var logger = log4js.getLogger("node-foursquare.core");
  
  function retrieve(url, callback) {
    callback = callback || emptyCallback;

    var parsedUrl = urlParser.parse(url, true), request, result = "";

    if(parsedUrl.protocol == "https:" && !parsedUrl.port) {
      parsedUrl.port = 443;
    }

    if(parsedUrl.query === undefined) {
      parsedUrl.query = {};
    }
    var path = parsedUrl.pathname + "?" + qs.stringify(parsedUrl.query);
    logger.debug("Requesting: " + path);
    request = https.request({
      "host" : parsedUrl.hostname,
      "port" : parsedUrl.port,
      "path" : path,
      "method" : "GET",
      "headers" : {
        "Content-Length": 0,
        "User-Agent": config.userAgent ? config.userAgent : 'node-foursquare'
      }
    }, function(res) {
      res.on("data", function(chunk) {
        result += chunk;
      });
      res.on("end", function() {
        callback(null, res.statusCode, res.headers, result);
      });
    });
    request.on("error", function(error) {
      logger.error("Error calling remote host: " + error.message);
      callback(error);
    });

    request.end();
  }

  function invokeApi(url, accessToken, callback) {

    callback = callback || emptyCallback;

    var parsedUrl = urlParser.parse(url, true);

    if(!accessToken) {
      parsedUrl.query.client_id = config.secrets.clientId;
      parsedUrl.query.client_secret = config.secrets.clientSecret;
    }
    else {
      parsedUrl.query.oauth_token = accessToken;
    }

    if(config.foursquare.version) {
      parsedUrl.query.v = config.foursquare.version;
    }

    parsedUrl.search = "?" + qs.stringify(parsedUrl.query);
    url = urlParser.format(parsedUrl);

    retrieve(url,
      function(error, status, headers, result) {
        if(error) {
          callback(error);
        }
        else {
          logger.trace(sys.inspect(result));
          callback(null, status, headers, result);
        }
      });
  }

  function extractData(url, status, headers, result, callback) {
    var json;
    callback = callback || emptyCallback;

    if(status !== undefined && result !== undefined) {
      try {
        json = JSON.parse(result);
      }
      catch(e) {
        callback(e);
        return;
      }

      if(json.meta && json.meta.code === 200) {
        if (headers['x-ratelimit-remaining']) {
          json.response.rateLimitRemaining = Number(headers['x-ratelimit-remaining']);
        }
        if (headers['x-ratelimit-limit']) {
          json.response.rateLimitLimit = Number(headers['x-ratelimit-limit']);
        }
        if (json.notifications) {
          var notif = json.notifications;
          if (notif) {
            for (var i = 0; i < notif.length; i++) {
              if (notif[i] && notif[i].type == "notificationTray" && notif[i].item) {
                if (notif[i].item.unreadCount && json.response !== undefined) {
                  json.response.unreadNotificationCount = notif[i].item.unreadCount;
                }
              }
            }
          }
        }

        if(json.meta.errorType) {
          var parsedUrl = urlParser.parse(url),
            message = parsedUrl.pathname + " (" + json.meta.errorType + "): " + json.meta.errorDetail || "No detail provided.";
          logger.debug("Warning level set to: " + config.foursquare.warnings);
          if(config.foursquare.warnings === "ERROR") {
            logger.error(message);
            callback(new Error(message));
            return;
          }
          else {
            logger.warn(message);
          }
        }
        if(json.response !== undefined) {
          callback(null, json.response);
        }
        else {
          callback(null, {});
        }
      }
      else if(json.meta) {
        logger.error("JSON Response had unexpected code: \"" + json.meta.code + ": " + json.meta.errorDetail + "\"");
        callback(new Error(json.meta.code + ": " + json.meta.errorDetail));
      }
      else {
        logger.error("Response had no code: " + sys.inspect(json));
        callback(new Error("Response had no code: " + sys.inspect(json)));
      }
    }
    else {
      logger.error("There was an unexpected, fatal error calling Foursquare: the response was undefined or had no status code.");
      callback(new Error("Foursquare had no response or status code."));
    }
  }

  function callApi(path, accessToken, params, callback) {

    var url = config.foursquare.apiUrl + path;

    if(params) {
      if((params.lat && !params.lng) || (!params.lat && params.lng)) {
        callback(new Error("parameters: if you specify a longitude or latitude, you must include BOTH."));
        return;
      }

      if(params.lat && params.lng) {
        params.ll = params.lat + "," + params.lng;
        delete params.lat;
        delete params.lng;
      }

      url += "?" + qs.stringify(params);
    }
    logger.trace("URL: " + url);
    invokeApi(url, accessToken, function(error, status, headers, result) {
      extractData(url, status, headers, result, callback);
    });
  }
  
  return {
    "retrieve" : retrieve,
    "invokeApi" : invokeApi,
    "extractData" : extractData,
    "callApi" : callApi
  }
};
