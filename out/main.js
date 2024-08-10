var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { render } from "./render.js";
import { model } from "./model/model.js";
import { initInput } from "./input/input.js";
import { colorTableParent, trueSizeCanvas } from "./dom.js";
function load() {
    return __awaiter(this, void 0, void 0, function* () {
        const worldJsonFile = yield fetch('world_json');
        if (!worldJsonFile.ok) {
            alert('failed to open world json');
            throw 'failed to open world json';
        }
        const world = (yield worldJsonFile.json());
        const activityJsonFile = yield fetch('gpx_json');
        if (!activityJsonFile.ok) {
            alert('failed to open json');
            throw ('failed to open json');
        }
        const activities = (yield activityJsonFile.json());
        model.init(activities, world);
        initInput();
        model.addListener(render);
        model.cam.addListener(render);
        render();
        colorTableParent.innerHTML = model.colorer.coloringTableHtml();
        model.colorer.addListener(() => {
            colorTableParent.innerHTML = model.colorer.coloringTableHtml();
        });
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        trueSizeCanvas();
        model.cam.updateCanvasWH();
        yield load();
    });
}
start();
