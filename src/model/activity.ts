import { durationSToHHMMSS } from "../util/time.js"
import { ColorStrat } from "./coloring.js"

export type CompactActivityFile = CompactActivity[]

export type CompactActivity = {
    id: number,
    name: string,
    date: string,
    miles: number,
    moving_time_secs: number,
    average_speed_mph: number,
    max_speed_mph: number,
    average_heartrate?: number,
    max_heartrate?: number,
    streams: Stream[]
}

export function getLatLngs(a: CompactActivity): LatLngCompact[] {
    const lls = a.streams.find(s => s.type == 'latlng')
    if (!lls) throw 'Missing latlng??'
    return lls.data
}

export function getHumanDate(a: CompactActivity): string {
    return new Date(a.date).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric"
    })
}

export function activityToString(a: CompactActivity): string {
    let ret = `
        Length: ${a.miles} miles
        Average speed: ${a.average_speed_mph} mph
        Moving time: ${durationSToHHMMSS(a.moving_time_secs)} 
    `
    if (a.average_heartrate) {
        ret += `
            Average heartrate: ${a.average_heartrate}
        `
    }
    return ret
}

export function eligibleForColoring(a: CompactActivity, strat: ColorStrat): boolean {
    if (strat != ColorStrat.HR) return true
    return a.streams.find(s => s.type == 'heartrate') != null
}

export type LatLngCompact = [number, number]

export type Stream = LatLngs | NumericStream;

export type LatLngs = {
    type: 'latlng',
    data: Array<LatLngCompact>
};

export type NumericStream = {
    type: 'time' | 'heartrate' | 'mph' | 'grade_pct' | 'elevation_meters' | 'miles',
    data: number[],
}
