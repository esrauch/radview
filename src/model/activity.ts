import { durationSToHHMMSS } from "../util/time.js"
import { ColorStrat } from "./coloring.js"

export type CompactActivityFile = CompactActivity[]

export type LatLngCompact = [number, number]

export type CompactActivity = {
    id: number,
    name: string,
    date: string,
    type: string,  // unset = bike 
    miles: number,
    moving_time_secs: number,
    average_speed_mph: number,
    max_speed_mph: number,
    average_heartrate?: number,
    max_heartrate?: number,

    // These are all parallel arrays
    times: number[],
    latlngs?: LatLngCompact[],
    streams: Stream[]
}

export type Stream = {
    type: 'heartrate' | 'mph' | 'grade_pct' | 'elevation_meters' | 'miles',
    data: number[],
}

export function getHumanDate(a: CompactActivity): string {
    return new Date(a.date).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric"
    })
}

export function getHumanActivityName(a: CompactActivity): string {
    return '[' + getHumanDate(a) + '] ' + a.name
}

export function activityToString(a: CompactActivity): string {
    let ret = `
        Length: ${a.miles} miles
        Average speed: ${a.average_speed_mph} mph
        Moving time: ${durationSToHHMMSS(a.moving_time_secs)}
        Type: ${a.type || 'bike'} 
    `
    if (a.average_heartrate) {
        ret += `
            Average heartrate: ${a.average_heartrate}
        `
    }
    return ret
}

export function eligibleForColoring(a: CompactActivity, strat: ColorStrat): boolean {
    if (strat == ColorStrat.HR) return a.streams.find(s => s.type == 'heartrate') != null
    if (strat == ColorStrat.YEAR) return new Date(a.date).getFullYear() == new Date().getFullYear()
    return true
}

