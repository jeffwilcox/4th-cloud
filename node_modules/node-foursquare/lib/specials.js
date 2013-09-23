/**
 * A module for retrieving information about Specials from Foursquare.
 * @param {Object} config A valid configuration.
 * @module node-foursquare/Specials
 */
module.exports = function(config){
  var core = require("./core")(config),
    log4js = require("log4js");

  log4js.configure(config.log4js);
  var logger = log4js.getLogger("node-foursquare.Specials");

  /**
   * Search for Foursquare specials.
   * @memberof module:node-foursquare/Specials
   * @param {String|Number} lat The latitude of the location around which to explore.
   * @param {String|Number} lng The longitude of the location around which to explore.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} [accessToken] The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/specials/search.html
   */
  function search(lat, lng, params, accessToken, callback) {
    logger.debug("ENTERING: Specials.search");
    params = params || {};

    if(!lat || !lng) {
      logger.error("Lat and Lng are both required parameters.");
      callback(new Error("Specials.search: lat and lng are both required."));
      return;
    }
    params.ll = lat + "," + lng;

    core.callApi("/specials/search", accessToken, params, callback);
  }

  /**
   * Search for Foursquare specials.
   * @memberof module:node-foursquare/Specials
   * @param {String} specialId The id of the special to retrieve.
   * @param {String} venueId The id of the venue at which the special is running.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} [accessToken] The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/specials/specials.html
   */
  function getSpecial(specialId, venueId, params, accessToken, callback) {
    logger.debug("ENTERING: Specials.search");
    params = params || {};

    if (!specialId) {
      logger.error("getSpecial: specialId is required.");
      callback(new Error("Specials.getSpecial: specialId is required."));
      return;
    }

    if (!venueId) {
      logger.error("getSpecial: venueId is required.");
      callback(new Error("Specials.getSpecial: venueId is required."));
      return;
    }

    core.callApi("/specials/search", accessToken, params, callback);
  }

  return {
    "search" : search,
    "getSpecial" : getSpecial
  }
};