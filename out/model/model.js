import { Camera } from "./camera.js";
import { desc } from "../dom.js";
import { Listenable } from "../listenable.js";
import { ColorStrat, Colorer } from "./coloring.js";
import { min, max } from "../util/util.js";
import { activityToString } from "./gpx_json.js";
class Model extends Listenable {
    constructor() {
        super(...arguments);
        this.activities = [];
        this.desc = '';
        this.current = [];
        this.current_nth = null; // null == ALL
        this.cam = new Camera();
        this.colorer = new Colorer(ColorStrat.WHITE);
        this.deselectedColorer = new Colorer(ColorStrat.GRAY);
        this.citySelect = 'high';
    }
    init(activities) {
        this.activities = activities;
        const miles = activities.map(a => a.miles);
        this.desc = `Shortest trip: ${Math.min(...miles).toPrecision(3)}mi
            Longest trip: ${Math.max(...miles).toPrecision(3)}mi
            Total dist: ${miles.reduce((prev, curr) => prev + curr, 0).toPrecision(3)} mi
        `;
        const flat = activities.map((a) => a.pts).flat();
        const minx = min(flat.map((pt) => pt.lon));
        const maxx = max(flat.map((pt) => pt.lon));
        const miny = min(flat.map((pt) => pt.lat));
        const maxy = max(flat.map((pt) => pt.lat));
        console.log(`Init saw box of = [${miny}, ${minx}, ${maxy}, ${maxx}]`);
        console.log(`Bounding box size is ${((maxy - miny) * 69).toPrecision(3)}mi North-South and ${((maxx - minx) * 69).toPrecision(3)}mi East-West`);
        this.colorer.addListener(this.trigger);
        this.all();
    }
    all() {
        this.current = this.activities;
        this.current_nth = null;
        desc.innerHTML = this.desc.replaceAll('\n', '<br>');
        this.triggerListeners();
    }
    nth(n) {
        const a = this.activities[n];
        if (!a) {
            this.all();
            return;
        }
        this.current = [a];
        this.current_nth = n;
        desc.innerHTML = activityToString(a).replaceAll('\n', '<br>');
        this.triggerListeners();
    }
    setCitySelect(s) {
        this.citySelect = s;
        this.triggerListeners();
    }
}
export const model = new Model();
window.model = model;