import { Listenable } from "../listenable.js";
export var ColorStrat;
(function (ColorStrat) {
    ColorStrat[ColorStrat["YEAR"] = 0] = "YEAR";
    ColorStrat[ColorStrat["WHITE"] = 1] = "WHITE";
    ColorStrat[ColorStrat["HR"] = 2] = "HR";
    ColorStrat[ColorStrat["SPEED"] = 3] = "SPEED";
    ColorStrat[ColorStrat["ELEVATION"] = 4] = "ELEVATION";
    ColorStrat[ColorStrat["GRAY"] = 5] = "GRAY";
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
    0.55 * HR_MAX, // 0
    0.65 * HR_MAX, // 1
    0.75 * HR_MAX, // 2
    0.85 * HR_MAX, // 3
    0.90 * HR_MAX, // 4
    HR_MAX, // 5  (anything higher will be 6
];
const mphThresholds = [
    4, // 0
    8, // 1
    12, // 2
    16, // 3
    20, // 4
    24, // 5 (anything higher will be 6)
];
const eleThresholds = [
    5, // 0
    10, // 1
    20, // 2
    40, // 3
    65, // 4
    80, // 5 (anything higher will be 6)
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
    [ColorStrat.WHITE]: (_) => '#fff',
    [ColorStrat.HR]: (hr) => zoneRgbs[zone(hr, hrThresholds)],
    [ColorStrat.SPEED]: (mph) => zoneRgbs[zone(mph, mphThresholds)],
    [ColorStrat.ELEVATION]: (ele) => zoneRgbs[zone(ele, eleThresholds)],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.YEAR]: (_) => '#fff',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.GRAY]: (_) => '#373737',
};
const CURRENT_YEAR = new Date().getFullYear();
export class Colorer extends Listenable {
    constructor(strat) {
        super();
        this.strat = ColorStrat.WHITE;
        this.fn = stratImpl[ColorStrat.WHITE];
        this.setStrat(strat);
    }
    refreshStream() {
        const a = this.activity;
        if (!a)
            return;
        const streamNameMap = {
            [ColorStrat.HR]: 'heartrate',
            [ColorStrat.SPEED]: 'mph',
            [ColorStrat.ELEVATION]: 'elevation_meters',
            [ColorStrat.YEAR]: undefined,
            [ColorStrat.GRAY]: undefined,
            [ColorStrat.WHITE]: undefined
        };
        const streamName = streamNameMap[this.strat];
        if (!streamName)
            return;
        const stream = a.streams.find(s => s.type == streamName);
        this.stream = stream === null || stream === void 0 ? void 0 : stream.data;
    }
    getStrat() {
        return this.strat;
    }
    setStrat(strat) {
        this.strat = strat;
        this.fn = stratImpl[strat];
        this.refreshStream();
        this.triggerListeners();
    }
    activateActivity(a) {
        this.activity = a;
        this.refreshStream();
    }
    fixedColor(a) {
        switch (this.strat) {
            case ColorStrat.WHITE: return '#FFF';
            case ColorStrat.GRAY: return '#373737';
            case ColorStrat.YEAR: return new Date(a.date).getFullYear() == CURRENT_YEAR ? '#F73' : '#777';
        }
        if (!this.stream)
            return 'rgba(0,0,0,0)';
    }
    color(idx) {
        if (!this.activity || !this.stream)
            throw `did not activate activity first`;
        return this.fn(this.stream[idx]);
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
