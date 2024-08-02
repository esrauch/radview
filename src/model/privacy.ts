

// The (dedistorted) lat/lon of a randomly offset location of home.
// This is used to apply a privacy filter, all points within a
// certain distance are all collapsed down to the one point when
// generating gpx_json.
// Someone could still see what neighborhood is 'home' but not

import { PtJson } from "./gpx_json.js"

// the specific address.
export const APPROXIMATE_HOME = {
    lon: -52.565382287129964,
    lat: 42.39951613195809
}

export const HOME_PRIVACY_CIRCLE_RADIUS_DEG = 0.0015

export function closeToHome(pt: PtJson): boolean {
    const dlon = pt.lon - APPROXIMATE_HOME.lon
    const dlat = pt.lat - APPROXIMATE_HOME.lat
    return Math.sqrt(dlon * dlon + dlat * dlat) < HOME_PRIVACY_CIRCLE_RADIUS_DEG
}