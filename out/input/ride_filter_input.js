import { rideFilterSelect } from "../dom.js";
import { model } from "../model/model.js";
function createOption(label, value) {
    const el = document.createElement('option');
    el.label = label;
    el.value = value.toString();
    return el;
}
export function initRideFilter() {
    const sel = rideFilterSelect;
    const options = model.activities.map((a, index) => createOption(a.name, index));
    options.reverse();
    options.forEach(opt => sel.add(opt));
    sel.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeyDown);
}
function onChange() {
    const val = rideFilterSelect.selectedOptions[0].value;
    if (val === "all")
        model.all();
    else
        model.nth(+val);
}
function onKeyDown(evt) {
    const sel = rideFilterSelect;
    let index = sel.selectedIndex;
    if (evt.key == 'ArrowRight') {
        index++;
        if (index == sel.options.length)
            index = 0;
        sel.selectedIndex = index;
        onChange();
        evt.preventDefault();
    }
    if (evt.key == 'ArrowLeft') {
        index--;
        if (index == -1)
            index = sel.options.length - 1;
        sel.selectedIndex = index;
        onChange();
        evt.preventDefault();
    }
}
