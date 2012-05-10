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

exports.ISODateString = function (d) {
    function pad(n) { return n < 10 ? '0' + n : n; }
    return d.getUTCFullYear() +
        '-' + pad(d.getUTCMonth() + 1) +
        '-' + pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' + 
        pad(d.getUTCSeconds()) + 'Z';
}

exports.returnNewDatePlusMinutes = function (dateObj, minutesToAdd) {
    var newDate = new Date(dateObj);
    newDate.setMinutes(dateObj.getMinutes() + minutesToAdd);

    return newDate;
}

exports.returnNewDateMinusMinutes = function (dateObj, minutesToRemove) {
    var newDate = new Date(dateObj);
    newDate.setMinutes(dateObj.getMinutes() - minutesToRemove);

    return newDate;
}
