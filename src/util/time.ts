

export function durationMsToHHMMSS(ms: number): string {
    return durationSToHHMMSS(ms / 1000)
}

export function durationSToHHMMSS(s: number): string {
    let secs = Math.floor(s % 60).toString()
    let minutes = Math.floor((s / 60) % 60).toString()
    const hours = Math.floor(s / 3600).toString()

    if (secs.length < 2) secs = "0" + secs
    if (minutes.length < 2) minutes = "0" + minutes
    return `${hours}:${minutes}:${secs}`
}