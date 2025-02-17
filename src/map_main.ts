import { render } from "./render.js"
import { model } from "./model/model.js"
import { Way, World } from "./model/world_json.js"
import { initInput } from "./input/input.js"
import { colorTableParent, trueSizeCanvas } from "./dom.js"
import { CompactActivity } from "./model/activity.js"


async function load() {
    const waterJsonFile = await fetch('water_json')
    if (!waterJsonFile.ok) {
        alert('failed to open world json')
        throw 'failed to open world json'
    }
    const waters = ((await waterJsonFile.json()) as World).waters

    // const pathsJsonFile = await fetch('paths_with_seen_json')
    // if (!pathsJsonFile.ok) {
    //     alert('failed to open world json')
    //     throw 'failed to open world json'
    // }
    // const paths = ((await pathsJsonFile.json()) as World).paths
    const paths: Way[] = []

    const activityJsonFile = await fetch('rides_json')
    if (!activityJsonFile.ok) {
        alert('failed to open json')
        throw ('failed to open json')
    }
    const activities = (await activityJsonFile.json()) as CompactActivity[]

    model.init(activities, waters, paths)
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