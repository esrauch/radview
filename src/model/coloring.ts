import { Listenable } from "../listenable.js"
import { PtJson } from "./gpx_json.js"

export enum ColorStrat {
    WHITE,
    HR,
    SPEED,
    ELEVATION,
    GRAY,
}

function zone(val: number | undefined, thresholds: number[]): number {
    if (!val || isNaN(val)) return NaN
    for (let i = 0; i < thresholds.length; ++i) {
        const t = thresholds[i]
        if (val < t) return i
    }
    return 6
}

const HR_MAX = 190
const hrThresholds = [
    0.55 * HR_MAX,  // 0
    0.65 * HR_MAX,  // 1
    0.75 * HR_MAX,  // 2
    0.85 * HR_MAX,  // 3
    0.90 * HR_MAX,  // 4
    HR_MAX, // 5  (anything higher will be 6
]

const mphThresholds = [
    6,  // 0
    9,  // 1
    11, // 2
    13, // 3
    16, // 4
    20, // 5 (anything higher will be 6
]

const eleThresholds = [
    5,  // 0
    10,  // 1
    15, // 2
    20, // 3
    25, // 4
    30, // 5 (anything higher will be 6
]

const zoneRgbs: { [zone: number]: string } = {
    NaN: '#555',
    0: '#77b',
    1: '#9bb',
    2: '#5b5',
    3: '#ffa',
    4: '#f77',
    5: '#f33',
    6: '#ff028d'
}

const stratImpl = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.WHITE]: (_pt: PtJson) => '#fff',
    [ColorStrat.HR]: (pt: PtJson) => zoneRgbs[zone(pt.hr, hrThresholds)],
    [ColorStrat.SPEED]: (pt: PtJson) => zoneRgbs[zone(pt.mph, mphThresholds)],
    [ColorStrat.ELEVATION]: (pt: PtJson) => zoneRgbs[zone(pt.ele, eleThresholds)],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.GRAY]: (_pt: PtJson) => '#373737',
}

export class Colorer extends Listenable {
    private strat = ColorStrat.WHITE
    private fn = stratImpl[ColorStrat.WHITE]

    constructor(strat: ColorStrat) {
        super()
        this.setStrat(strat)
    }

    setStrat(strat: ColorStrat) {
        this.strat = strat
        this.fn = stratImpl[strat]
        this.triggerListeners()
    }

    color(pt: PtJson): string {
        return this.fn(pt)
    }

    coloringTableHtml(): string {
        const strat = this.strat
        const tsMap: Record<number, number[]> = {
            [ColorStrat.HR]: hrThresholds,
            [ColorStrat.SPEED]: mphThresholds,
            [ColorStrat.ELEVATION]: eleThresholds,
        }
        const ts = tsMap[strat as number]
        // WHITE and GRAY don't have thresholds
        if (!ts) return ''

        const has_unknown = (strat == ColorStrat.HR)

        let h = '<table class="coloringTable"><tr>'

        if (has_unknown) h += '<td>?</td>'

        let last = 0
        for (const t of ts) {
            const curr = Math.round(t)
            h += `<td>${last} - ${curr}</td>`
            last = curr
        }
        h += `<td>&gt; ${last}</td>`
        h += '</tr>'

        h += '<tr>'

        if (has_unknown)
            h += `<td style="background-color: ${zoneRgbs[NaN]}"></td>`

        for (let i = 0; i <= 6; ++i) {
            h += `<td style="background-color: ${zoneRgbs[i]}">&nbsp;</td>`
        }
        h += '</tr>'

        h += '</table>'
        return h
    }
}