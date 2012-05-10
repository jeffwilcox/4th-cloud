/**
 * A module for retrieving information about Users from Foursquare.
 * @param {Object} config A valid configuration.
 * @module node-foursquare/Users
 */
module.exports = function(config) {
  var core = require("./core")(config),
    log4js = require("log4js");

  log4js.configure(config.log4js);
  var logger = log4js.getLogger("node-foursquare.Users");
  
  /**
   * Returns the leaderboard for the User identified by the supplied accessToken.
   * @memberof module:node-foursquare/Users
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/leaderboard.html
   */
  function getLeaderboard(params, accessToken, callback) {
    logger.debug("ENTERING: Users.getLeaderboard");
    core.callApi("/users/leaderboard", accessToken, params || {}, callback);
  }

  /**
   * Find Foursquare Users.
   * @memberof module:node-foursquare/Users
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/search.html
   */
  function search(params, accessToken, callback) {
    logger.debug("ENTERING: Users.search");
    core.callApi("/users/search", accessToken, params || {}, callback);
  }


  /**
   * Retrieve Friend Requests for the user identified by the supplied accessToken.
   * @memberof module:node-foursquare/Users
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/requests.html
   */
  function getRequests(accessToken, callback) {
    logger.debug("ENTERING: Users.getRequests");
    core.callApi("/users/requests", accessToken, {}, callback);
  }

  /**
   * Retrieve a Foursquare User.
   * @memberof module:node-foursquare/Users
   * @param {String} userId The id of the User to retreive.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/users.html
   */
  function getUser(userId, accessToken, callback) {
    logger.debug("ENTERING: Users.getUser");

    if(!userId) {
      logger.error("getUser: userId is required.");
      callback(new Error("Users.getUser: userId is required."));
      return;
    }

    core.callApi("/users/" + userId, accessToken, null, callback);
  }

  /**
   * Retreive a named aspect for a User from the Foursquare API.
   * @memberof module:node-foursquare/Users
   * @param {String} aspect The aspect to retrieve. Refer to Foursquare documentation for details on currently
   * supported aspects.
   * @param {String} [userId="self"] The id of the User to retreive.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/index_docs.html
   */
  function getUserAspect(aspect, userId, params, accessToken, callback) {
    logger.debug("ENTERING: Users.getUser");

    if(!aspect) {
      logger.error("getUserAspect: aspect is required.");
      callback(new Error("Users.getUserAspect: aspect is required."));
      return;
    }
    
    core.callApi("/users/" + (userId || "self") + "/" + aspect, accessToken, params, callback);
  }

  /**
   * Retrieve a list of badges.
   * @memberof module:node-foursquare/Users
   * @param {String} [userId="self"] The id of the user.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/badges.html
   */
  function getBadges(userId, accessToken, callback) {
    logger.debug("ENTERING: Users.getBadges");
    getUserAspect("badges", userId, null, accessToken, callback);
  }

  /**
   * Retrieve Check-ins for a Foursquare User.
   * @memberof module:node-foursquare/Users
   * @param {String} [userId="self"] The id of the user.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/checkins.html
   */
  function getCheckins(userId, params, accessToken, callback) {
    logger.debug("ENTERING: Users.getCheckins");
    getUserAspect("checkins", userId, params, accessToken, callback);
  }

  /**
   * Retrieve Friends for a Foursquare User.
   * @memberof module:node-foursquare/Users
   * @param {String} [userId="self"] The id of the user.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/friends.html
   */
  function getFriends(userId, params, accessToken, callback) {
    logger.debug("ENTERING: Users.getFriends");
    getUserAspect("friends", userId, params, accessToken, callback);
  }


  /**
   * Retrieve Friends for a Foursquare User.
   * @memberof module:node-foursquare/Users
   * @param {String} [userId="self"] The id of the user.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/friends.html
   */
  function getMayorships(userId, params, accessToken, callback) {
    logger.debug("ENTERING: Users.getMayorships");
    getUserAspect("mayorships", userId, params, accessToken, callback);
  }

  /**
   * Retrieve Tips for a Foursquare User.
   * @memberof module:node-foursquare/Users
   * @param {String} [userId="self"] The id of the user.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String|Number} [params.lat] The latitude of the location around which to search.
   * @param {String|Number} [params.lng] The longitude of the location around which to search.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/tips.html
   */
  function getTips(userId, params, accessToken, callback) {
    logger.debug("ENTERING: Users.getTips");
    getUserAspect("tips", userId, params, accessToken, callback);
  }

  /**
   * Retrieve Todos for a Foursquare User.
   * @memberof module:node-foursquare/Users
   * @param {String} [userId="self"] The id of the user.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String|Number} [params.lat] The latitude of the location around which to search.
   * @param {String|Number} [params.lng] The longitude of the location around which to search.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/todos.html
   */
  function getTodos(userId, params, accessToken, callback) {
    logger.debug("ENTERING: Users.getTodos");
    params = params || {};
    params.sort = params.sort || "recent";
    getUserAspect("todos", userId, params, accessToken, callback);
  }

  /**
   * Retrieve Venues visited by a Foursquare User.
   * @memberof module:node-foursquare/Users
   * @param {String} [userId="self"] The id of the user.
   * @param {Object} [params] An object containing additional parameters. Refer to Foursquare documentation for details
   * on currently supported parameters.
   * @param {String} accessToken The access token provided by Foursquare for the current user.
   * @param {Function} callback The function to call with results, function({Error} error, {Object} results).
   * @see https://developer.foursquare.com/docs/users/venuehistory.html
   */
  function getVenueHistory(userId, params, accessToken, callback) {
    logger.debug("ENTERING: Users.getVenueHistory");
    getUserAspect("venuehistory", userId, params, accessToken, callback);
  }

  return {
    "getLeaderboard" : getLeaderboard,
    "search" : search,
    "getRequests" : getRequests,
    "getUser" : getUser,
    "getUserAspect" : getUserAspect,
    "getBadges" : getBadges,
    "getCheckins" : getCheckins,
    "getFriends" : getFriends,
    "getMayorships" : getMayorships,
    "getTips" : getTips,
    "getTodos" : getTodos,
    "getVenueHistory" : getVenueHistory
  }
};