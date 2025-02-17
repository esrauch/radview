import { CompactActivity, getHumanActivityName } from "./model/activity.js"

async function load(): Promise<CompactActivity[]> {
    const activityJsonFile = await fetch('rides_json')
    if (!activityJsonFile.ok) {
        alert('failed to open json')
        throw ('failed to open json')
    }
    const activities = (await activityJsonFile.json()) as CompactActivity[]
    return activities
}

function addActivity(el: HTMLSelectElement, a: CompactActivity) {
    const opt = document.createElement('option')
    opt.label = getHumanActivityName(a)
    opt.value = `${a.id}`
    el.appendChild(opt)
}

function init(activities: CompactActivity[]) {
    const activitySelect = document.querySelector('#activity') as HTMLSelectElement | undefined
    if (!activitySelect) {
        throw 'missing activity select'
    }
    const chartsContainerMaybe = document.querySelector('#chartsContainer')
    if (!chartsContainerMaybe) {
        throw 'missing charts container'
    }
    const chartsContainer = chartsContainerMaybe
    for (const a of activities) {
        addActivity(activitySelect, a)
    }
    activitySelect.addEventListener('change', () => {
        addCharts(activitySelect.selectedOptions[0].value)
    })

    function addCharts(id: string) {
        if (id == 'all') return
        const a = activities.find(act => act.id == +id)
        if (!a) throw `missing activity ${id}`
        chartsContainer.innerHTML = ''
        for (const s of a.streams) addChart(a.times, s.data, s.type)
    }

    function addChart(x: number[], y: number[], type: string) {
        if (x.length != y.length) {
            console.error(`Mismatched x/y length for ${type}: ${x.length} vs ${y.length}`)
            return
        }
        const el = document.createElement('div')
        const c = document.createElement('canvas')
        c.width = 800
        c.height = 600
        const ctx = c.getContext('2d')!

        el.innerHTML = `time vs ${type}<br>`
    }
}

load().then(init)