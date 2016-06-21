/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns n random unique items from the given list.
 * An optional list of items to exclude may be given.
 */
function getRandomItems(items, n, exclude) {
    var result = [];
    var loopBreaker = 10;
    while (result.length < n) {
        if (loopBreaker == 0) { return result; }
        var chosen = items[getRandomInt(0, items.length - 1)];
        // skip excluded items
        if (exclude != undefined && exclude.indexOf(chosen) > -1) {
            loopBreaker -= 1;
            continue;
        }
        // choose unique items
        if (result.indexOf(chosen) === -1) {
            result.push(chosen);
        }
        else {
            loopBreaker -= 1;
        }
    }
    return result;
}

/**
 * Choose and return one item from a list of items.
 */
function chooseOne(items) {
    return items[Math.floor(Math.random() * items.length)];
};

/**
 * Calculate cartesian coordinates from GPS radians.
 */
function convertRadiansToCartesian(lon, lat) {
  // (-29.858680, 31.02184)
    var R = 6371;   // approximate radius of planet earth
    var x = R * Math.cos(lat) * Math.cos(lon);
    var y = R * Math.cos(lat) * Math.sin(lon);
    //z = R *sin(lat)
    return new {'x': x, 'y': y};
    
    // http://www.latlong.net/
    // https://en.wikipedia.org/wiki/Equirectangular_projection
    // http://www.movable-type.co.uk/scripts/latlong.html
    // http://stackoverflow.com/questions/1185408/converting-from-longitude-latitude-to-cartesian-coordinates
};