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

module.exports = StaticSite;

function StaticSite(context) {
  this.context = context;
};

StaticSite.prototype = {
  showStaticPage: function (req, res, viewName, title, locals) {
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
  },

  homepage: function (req, res) {
    var self = this;
    self.showStaticPage(req, res, 'home', 'The best foursquare experience for Windows Phone', {
        isWide: true,
        extraFeeds: '<meta property="fb:page_id" content="145528958837083" />',
        extraCss: '<link rel="stylesheet" href="https://d2tz2ccf2zi8lx.cloudfront.net/media/fancybox/jquery.fancybox-1.3.4.css" type="text/css" media="screen" /><script type="text/javascript" src="https://d2tz2ccf2zi8lx.cloudfront.net/media/fancybox/jquery.fancybox-1.3.4.pack.js"></script>'
    });
  },

  features: function (req, res) {
    var self = this;
    self.showStaticPage(req, res, 
      'features',
      'Features & Screenshots', {
        isWide: true
      });
  },

  about: function (req, res) {
    var self = this;
    self.showStaticPage(req, res, 
      'about',
      'About Jeff Wilcox', {
        isWide: true
      });
  },

  privacy: function (req, res) {
    var self = this;
    self.showStaticPage(req, res,
      'privacy',
      'Privacy', {
        isWide: true
      });
  },

  support: function (req, res) {
    var self = this;
    self.showStaticPage(req, res,
      'support',
      'Feedback and Support', {
        isWide: true
      });
  }
};
