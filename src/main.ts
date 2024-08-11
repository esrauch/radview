import { render } from "./render.js"
import { model } from "./model/model.js"
import { World } from "./model/world_json.js"
import { initInput } from "./input/input.js"
import { colorTableParent, trueSizeCanvas } from "./dom.js"
import { ActivityJson } from "./model/gpx_json.js"

async function load() {
    const waterJsonFile = await fetch('water_json')
    if (!waterJsonFile.ok) {
        alert('failed to open world json')
        throw 'failed to open world json'
    }
    const waterWorld = (await waterJsonFile.json()) as World

    const activityJsonFile = await fetch('gpx_json')
    if (!activityJsonFile.ok) {
        alert('failed to open json')
        throw ('failed to open json')
    }
    const activities = (await activityJsonFile.json()) as ActivityJson[]

    model.init(activities, waterWorld.waters)
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