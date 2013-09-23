/**
 * A module for retrieving information about Checkins from Foursquare.
 * @param {Object} config A valid configuration.
 * @module node-foursquare/Checkins
 */
module.exports = function(config) {
  var core = require("./core")(config),
      path = require("path"),
      log4js = require("log4js");

  log4js.configure(config.log4js);
  var logger = log4js.getLogger("node-foursquare.Tips");

  /**
   * Retrieve a Foursquare Check-in.
   * @memberof module:node-foursquare/Checkins
   * @param {String} checkinId The id of the check-in.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/checkins/checkins.html
   */
  function getCheckin(checkinId, params, accessToken, callback) {
    logger.debug("ENTERING: Checkins.getCheckin");

    if(!checkinId) {
      logger.error("getCheckin: checkinId is required.");
      callback(new Error("Checkins.getCheckin: checkinId is required."));
      return;
    }

    core.callApi(path.join("/checkins", checkinId), accessToken, params || {}, callback);
  }

  /**
   * Retreive recent checkins.
   * @memberof module:node-foursquare/Checkins
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String|Number} [params.lat] The latitude of the location around which to search.
   * @param {String|Number} [params.lng] The longitude of the location around which to search.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/checkins/recent.html
   */
  function getRecentCheckins(params, accessToken, callback) {
    logger.debug("ENTERING: Checkins.getRecentCheckins");
    core.callApi("/checkins/recent", accessToken, params || {}, callback);
  }

  return {
    "getCheckin" : getCheckin,
    "getRecentCheckins" : getRecentCheckins
  }
};