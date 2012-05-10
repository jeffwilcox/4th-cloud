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

// experience route

module.exports = function (app, context) {
	this.context = context;

	// app.all('/experience(/*)?', )

	function getUserData(req, res, next) {
	  	var self = this;
	  	if (req.user && req.user.id) {
	  		req.userData = require('../../foursquareUser')(self.context, req.user.id);
	  	}
		return next();
	}

	function showStaticPage(req, res, viewName, title, locals) {
	    var newLocals = {
	      title: title,
	      user: req.user,
        instanceId: this.context.environment.instanceName
	    };
	    if (locals) {
	      for (var key in locals) {
	        newLocals[key] = locals[key];
	      }
	    }
	    res.render(viewName, newLocals);
  	}

  	app.get('/experience/devices/remove/:clientId',
  		app.ensureAuthenticated,
  		getUserData,
  		function (req, res) {
  			var clientId = req.params.clientId;
  			req.userData.getDevices(function (err, rr) {
  				if (rr && rr.length) {
  					var entry = null;
  					for (var i = 0; i < rr.length; i++) {
  						var e = rr[i];
  						if (e._id == clientId) {
  							entry = e;
  							break;
  						}
  					}
  					if (entry == null) {
  						res.send('Something went wrong.');
  					} else {
  						var uri = entry.uri;
  						req.userData.removeDevice(uri, function (err, res2) {
  //              if (err) {
//                  res.send("Ooops.... " + JSON.stringify(err));
    //            } else {
					        res.redirect('/experience');  							
      //          }
  						});
  					}
  				} else { 
  					res.send("Something went wrong. We're going to work on it in the future. Sorry!."); }
  			});
  		});

  	app.get('/experience/toast/:clientId',
  		app.ensureAuthenticated,
  		getUserData,
  		function (req, res) {
  			var clientId = req.params.clientId;
  			req.userData.getDevices(function (err, rr) {
  				if (rr && rr.length) {
  					var entry = null;
  					for (var i = 0; i < rr.length; i++) {
  						var e = rr[i];
  						if (e._id == clientId) {
  							entry = e;
  							break;
  						}
  					}
  					if (entry == null) {
  						res.send('Something went wrong.');
  					} else {
  						var uri = entry.uri;
  						var mpns = require('mpns');
			            var toast = new mpns.toast( {
			                text1: 'Testing',
			                text2: 'from 4thandmayor.com'
			            });

			            toast.send(uri, function (err, resp) {
			            	var title = err ? 'Toast failure' : 'Toast sent OK';
			            	var data = {
			            		isError: err ? true : false,
			            		err: err,
			            		isWide: true,
			            		response: resp
			            	};

			            	showStaticPage(req, res, 'toastTest', title, data);
			            });
  					}
  				} else { 
  					res.send("Something went wrong. We're going to work on it in the future. Sorry!."); }
  			});
  		});

    app.get('/experience', 
        app.ensureAuthenticated, 
        getUserData,
        function (req, res) {
	    	var self = this;
		    var o = {
		    	isWide: true
		    };

		    if (req.userData) {
		    	req.userData.getDevices(function (err, rr) {
		    		o.devices = rr;
				    showStaticPage(req, res, 'experience', 'My 4th & Mayor Experience', o);
		    	});
		    } else {

		    }
		});

}
