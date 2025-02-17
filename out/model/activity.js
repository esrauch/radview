import { durationSToHHMMSS } from "../util/time.js";
import { ColorStrat } from "./coloring.js";
export function getHumanDate(a) {
    return new Date(a.date).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric"
    });
}
export function activityToString(a) {
    let ret = `
        Length: ${a.miles} miles
        Average speed: ${a.average_speed_mph} mph
        Moving time: ${durationSToHHMMSS(a.moving_time_secs)}
        Type: ${a.type || 'bike'} 
    `;
    if (a.average_heartrate) {
        ret += `
            Average heartrate: ${a.average_heartrate}
        `;
    }
    return ret;
}
export function eligibleForColoring(a, strat) {
    if (strat != ColorStrat.HR)
        return true;
    return a.streams.find(s => s.type == 'heartrate') != null;
}
