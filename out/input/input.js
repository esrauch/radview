import { citySelect, colorInputSelect } from "../dom.js";
import { model } from "../model/model.js";
import { initMouse } from "./mouse.js";
import { initRideFilter } from "./ride_filter_input.js";
import { initTouch } from "./touch.js";
export function initInput() {
    initMouse();
    initTouch();
    initRideFilter();
    colorInputSelect.addEventListener('change', () => {
        model.colorer.setStrat(+colorInputSelect.selectedOptions[0].value);
    });
    citySelect.addEventListener('change', () => {
        model.setCitySelect(citySelect.selectedOptions[0].value);
    });
}
