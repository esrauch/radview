var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getHumanActivityName } from "./model/activity.js";
import { durationSToHHMMSS } from "./util/time.js";
import { max, min } from "./util/util.js";
function load() {
    return __awaiter(this, void 0, void 0, function* () {
        const activityJsonFile = yield fetch('rides_json');
        if (!activityJsonFile.ok) {
            alert('failed to open json');
            throw ('failed to open json');
        }
        const activities = (yield activityJsonFile.json());
        return activities;
    });
}
function addActivity(el, a) {
    const opt = document.createElement('option');
    opt.label = getHumanActivityName(a);
    opt.value = `${a.id}`;
    el.appendChild(opt);
}
function init(activities) {
    const activitySelect = document.querySelector('#activity');
    if (!activitySelect) {
        throw 'missing activity select';
    }
    const chartsContainerMaybe = document.querySelector('#chartsContainer');
    if (!chartsContainerMaybe) {
        throw 'missing charts container';
    }
    const chartsContainer = chartsContainerMaybe;
    for (const a of activities) {
        addActivity(activitySelect, a);
    }
    activitySelect.addEventListener('change', () => {
        addCharts(activitySelect.selectedOptions[0].value);
    });
    function addCharts(id) {
        if (id == 'all')
            return;
        const a = activities.find(act => act.id == +id);
        if (!a)
            throw `missing activity ${id}`;
        chartsContainer.innerHTML = '';
        if (a.latlngs) {
            const lats = a.latlngs.map(ll => ll[0]);
            const lons = a.latlngs.map(ll => ll[1]);
            addChart(lons, lats, 'lon', 'lat');
        }
        for (const s of a.streams)
            addChart(a.times, s.data, 'time', s.type);
    }
    function addChart(xs, ys, xtype, ytype) {
        if (xs.length != ys.length) {
            console.error('Mismatched x/y length');
            return;
        }
        const el = document.createElement('div');
        const c = document.createElement('canvas');
        c.width = 800;
        c.height = 600;
        el.innerHTML = `${xtype} vs ${ytype}<br>`;
        el.appendChild(c);
        el.appendChild(document.createElement('hr'));
        const ctx = c.getContext('2d');
        const minx = min(xs);
        const miny = min(ys);
        const maxx = max(xs);
        const maxy = max(ys);
        ctx.strokeStyle = '#fff';
        for (let i = 0; i < xs.length; ++i) {
            const x = (xs[i] - minx) / (maxx - minx);
            const y = (ys[i] - miny) / (maxy - miny);
            ctx.lineTo(x * c.width, (1 - y) * c.height);
        }
        ctx.stroke();
        // y axis labels
        ctx.fillStyle = '#5da';
        const numYLabels = 10;
        for (let i = 1; i < numYLabels; ++i) {
            const val = (i / numYLabels) * (maxy - miny) + miny;
            ctx.fillText(val.toFixed(2), 0, (1 - (i / numYLabels)) * c.height);
        }
        // x axis labels
        const numXLabels = 15;
        for (let i = 1; i < numXLabels; ++i) {
            const val = (i / numXLabels) * (maxx - minx) + minx;
            const label = xtype == 'time' ? durationSToHHMMSS(val) : val.toFixed(2);
            ctx.fillText(label, (i / numXLabels) * c.width, c.height);
        }
        chartsContainer.appendChild(el);
    }
}
load().then(init);
