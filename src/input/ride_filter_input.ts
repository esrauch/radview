import { rideFilterSelect } from "../dom.js"
import { eligibleForColoring, getHumanActivityName } from "../model/activity.js"
import { model } from "../model/model.js"


function createOption(label: string, value: number): HTMLOptionElement {
    const el = document.createElement('option')
    el.label = label
    el.value = value.toString()
    return el
}

export function initRideFilter() {
    const sel = rideFilterSelect
    const options = model.activities.map((a, index) => createOption(getHumanActivityName(a), index))
    options.reverse()
    options.forEach(opt => sel.add(opt))

    sel.addEventListener('change', onChange)
    document.addEventListener('keydown', onKeyDown)

    model.colorer.addListener(() => {
        // Anytime the colorer is changed, and it is HR, disable for any rides that aren't eligible
        const strat = model.colorer.getStrat()
        for (const o of options) { o.disabled = !eligibleForColoring(model.activities[+o.value], strat) }
    })
}


function onChange() {
    const val = rideFilterSelect.selectedOptions[0].value
    if (val === "all") model.all()
    else model.nth(+val)
}

function onKeyDown(evt: KeyboardEvent) {
    const sel = rideFilterSelect
    let index = sel.selectedIndex
    if (evt.key == 'ArrowRight') {
        index++
        if (index == sel.options.length) index = 0
        sel.selectedIndex = index
        onChange()
        evt.preventDefault()

    }
    if (evt.key == 'ArrowLeft') {
        index--
        if (index == -1) index = sel.options.length - 1
        sel.selectedIndex = index
        onChange()
        evt.preventDefault()
    }
}