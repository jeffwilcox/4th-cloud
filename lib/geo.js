// ---------------------------------------------------------------------------
// GPS and Location information
// ---------------------------------------------------------------------------
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2011            */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */

exports.greatCircleDistance = function (lat1, lon1, lat2, lon2) {
    var R = 6371, // km
        dLat = (lat2 - lat1) * Math.PI / 180,
        dLon = (lon2 - lon1) * Math.PI / 180,
        llat1 = lat1 * Math.PI / 180,
        llat2 = lat2 * Math.PI / 180,
        a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(llat1) * Math.cos(llat2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        d = R * c;
    return d;
}
