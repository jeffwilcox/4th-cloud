//
// Copyright (C) 2011-2012 Jeff Wilcox
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

module.exports = StaticSite;

function StaticSite() {
};

StaticSite.prototype = {
  showStaticPage: function (req, res, viewName, title, locals) {
    var newLocals = {
      title: title,
      user: req.user,
      instanceId: 'instance',
    };

    if (locals) {
      for (var key in locals) {
        newLocals[key] = locals[key];
      }
    }
    res.render(viewName, newLocals);
  },


  }
};
