import { render } from "./render.js"
import { model } from "./model/model.js"
import { initInput } from "./input/input.js"
import { colorTableParent, trueSizeCanvas } from "./dom.js"
import { ActivityJson } from "./model/gpx_json.js"

async function load() {
    const jsonFile = await fetch('gpx_json')
    if (!jsonFile.ok) {
        alert('failed to open json')
        throw ('failed to open json')
    }
    const json = (await jsonFile.json()) as ActivityJson[]

    model.init(json)
    initInput()
    model.addListener(render)
    model.cam.addListener(render)
    render()

    colorTableParent.innerHTML = model.colorer.coloringTableHtml()
    model.colorer.addListener(() => {
        colorTableParent.innerHTML = model.colorer.coloringTableHtml()
    })
}

async function start() {
    trueSizeCanvas()
    model.cam.updateCanvasWH()
    await load()
}


start()