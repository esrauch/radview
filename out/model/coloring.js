import { Listenable } from "../listenable.js";
export var ColorStrat;
(function (ColorStrat) {
    ColorStrat[ColorStrat["WHITE"] = 0] = "WHITE";
    ColorStrat[ColorStrat["HR"] = 1] = "HR";
    ColorStrat[ColorStrat["SPEED"] = 2] = "SPEED";
    ColorStrat[ColorStrat["ELEVATION"] = 3] = "ELEVATION";
    ColorStrat[ColorStrat["GRAY"] = 4] = "GRAY";
})(ColorStrat || (ColorStrat = {}));
function zone(val, thresholds) {
    if (!val || isNaN(val))
        return NaN;
    for (let i = 0; i < thresholds.length; ++i) {
        const t = thresholds[i];
        if (val < t)
            return i;
    }
    return 6;
}
const HR_MAX = 190;
const hrThresholds = [
    0.55 * HR_MAX,
    0.65 * HR_MAX,
    0.75 * HR_MAX,
    0.85 * HR_MAX,
    0.90 * HR_MAX,
    HR_MAX, // 5  (anything higher will be 6
];
const mphThresholds = [
    6,
    9,
    11,
    13,
    16,
    20, // 5 (anything higher will be 6
];
const eleThresholds = [
    5,
    10,
    15,
    20,
    25,
    30, // 5 (anything higher will be 6
];
const zoneRgbs = {
    NaN: '#555',
    0: '#77b',
    1: '#9bb',
    2: '#5b5',
    3: '#ffa',
    4: '#f77',
    5: '#f33',
    6: '#ff028d'
};
const stratImpl = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.WHITE]: (_pt) => '#fff',
    [ColorStrat.HR]: (pt) => zoneRgbs[zone(pt.hr, hrThresholds)],
    [ColorStrat.SPEED]: (pt) => zoneRgbs[zone(pt.mph, mphThresholds)],
    [ColorStrat.ELEVATION]: (pt) => zoneRgbs[zone(pt.ele, eleThresholds)],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.GRAY]: (_pt) => '#373737',
};
export class Colorer extends Listenable {
    constructor(strat) {
        super();
        this.strat = ColorStrat.WHITE;
        this.fn = stratImpl[ColorStrat.WHITE];
        this.setStrat(strat);
    }
    setStrat(strat) {
        this.strat = strat;
        this.fn = stratImpl[strat];
        this.triggerListeners();
    }
    color(pt) {
        return this.fn(pt);
    }
    coloringTableHtml() {
        const strat = this.strat;
        const tsMap = {
            [ColorStrat.HR]: hrThresholds,
            [ColorStrat.SPEED]: mphThresholds,
            [ColorStrat.ELEVATION]: eleThresholds,
        };
        const ts = tsMap[strat];
        // WHITE and GRAY don't have thresholds
        if (!ts)
            return '';
        const has_unknown = (strat == ColorStrat.HR);
        let h = '<table class="coloringTable"><tr>';
        if (has_unknown)
            h += '<td>?</td>';
        let last = 0;
        for (const t of ts) {
            const curr = Math.round(t);
            h += `<td>${last} - ${curr}</td>`;
            last = curr;
        }
        h += `<td>&gt; ${last}</td>`;
        h += '</tr>';
        h += '<tr>';
        if (has_unknown)
            h += `<td style="background-color: ${zoneRgbs[NaN]}"></td>`;
        for (let i = 0; i <= 6; ++i) {
            h += `<td style="background-color: ${zoneRgbs[i]}">&nbsp;</td>`;
        }
        h += '</tr>';
        h += '</table>';
        return h;
    }
}
