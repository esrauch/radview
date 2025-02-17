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
        for (const s of a.streams)
            addChart(a.times, s.data, s.type);
    }
    function addChart(x, y, type) {
        if (x.length != y.length) {
            console.error(`Mismatched x/y length for ${type}: ${x.length} vs ${y.length}`);
            return;
        }
        const el = document.createElement('div');
        const c = document.createElement('canvas');
        c.width = 800;
        c.height = 600;
        const ctx = c.getContext('2d');
        el.innerHTML = `time vs ${type}<br>`;
    }
}
load().then(init);
