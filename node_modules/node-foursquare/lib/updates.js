/**
 * A module for retrieving information about Updates and Notifications from Foursquare.
 * @param {Object} config A valid configuration.
 * @module node-foursquare/Updates
 */
module.exports = function(config) {
  var core = require("./core")(config),
    path = require("path"),
    log4js = require("log4js");

  log4js.configure(config.log4js);
  var logger = log4js.getLogger("node-foursquare.Updates");

  /**
   * Retrieve an Update.
   * @memberof module:node-foursquare/Updates
   * @param {String} updateId The id of a Update.
   * @param {String} [accessToken] The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/updates/updates.html
   */
  function getUpdate(updateId, accessToken, callback) {
    logger.debug("ENTERING: Updates.getUpdate");

    if(!updateId) {
      logger.error("getUpdate: updateId is required.");
      callback(new Error("Updates.getUpdate: updateId is required."));
      return;
    }

    core.callApi(path.join("/updates", updateId), accessToken, null, callback);
  }
  /**
   * Retrieve notifications for the current user.
   * @memberof module:node-foursquare/Updates
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} [accessToken] The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/updates/notifications.html
   */
  function getNotifications(params, accessToken, callback) {
    logger.debug("ENTERING: Updates.getNotifications");
    core.callApi("/updates/notifications", accessToken, params || {}, callback);
  }

  return {
    "getUpdate" : getUpdate,
    "getNotifications" : getNotifications
  }
};