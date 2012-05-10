/**
 * A module for retrieving information about Tips from Foursquare.
 * @param {Object} config A valid configuration.
 * @module node-foursquare/Tips
 */
module.exports = function(config) {
  var core = require("./core")(config),
    path = require("path"),
    log4js = require("log4js");

  log4js.configure(config.log4js);
  var logger = log4js.getLogger("node-foursquare.Tips");

  /**
   * Retrieve a Tip.
   * @memberof module:node-foursquare/Tips
   * @param {String} tipId The id of a Tip.
   * @param {String} [accessToken] The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/tips/tips.html
   */
  function getTip(tipId, accessToken, callback) {
    logger.debug("ENTERING: Tips.getTip");

    if(!tipId) {
      logger.error("getTip: tipId is required.");
      callback(new Error("Tips.getTip: tipId is required."));
      return;
    }

    core.callApi(path.join("/tips", tipId), accessToken, null, callback);
  }

  /**
   * Search for tips around a location.
   * @memberof module:node-foursquare/Tips
   * @param {String|Number} lat The latitude of the location around which to search.
   * @param {String|Number} lng The longitude of the location around which to search.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} [accessToken] The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see http://developer.foursquare.com/docs/tips/search.html
   */
  function search(lat, lng, params, accessToken, callback) {
    logger.debug("ENTERING: Tips.getTip");
    params = params || {};

    if(!lat || !lng) {
      logger.error("getTips: Lat and Lng are both required parameters.");
      callback(new Error("searchTips: lat and lng are both required."));
      return;
    }
    params.ll = lat + "," + lng;

    core.callApi("/tips/search", accessToken, params, callback);
  }

  return {
    "getTip" : getTip,
    "search" : search
  }
};