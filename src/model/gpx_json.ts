
// Number of ms between points to count as discontiguous
// This affects both the gpx_json generation and
// the rendering
export const DISCONTIGUOUS_S = 60 * 15


// The (dedistorted) lat/lon of a randomly offset location of home.
// This is used to apply a privacy filter, all points within a
// certain distance are all collapsed down to the one point when
// generating gpx_json.
// Someone could still see what neighborhood is 'home' but not
// the specific address.
export const APPROXIMATE_HOME = {
    lon: -52.565382287129964,
    lat: 42.39951613195809
}

export const HOME_PRIVACY_CIRCLE_RADIUS_DEG = 0.0015
