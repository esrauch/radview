import { canvas, citySelect, colorInputSelect, downloadPng, hideOptions, showOptions, sidebarCollapsed, sidebarExpanded } from "../dom.js"
import { ColorStrat } from "../model/coloring.js"
import { CitySelect, model } from "../model/model.js"
import { initMouse } from "./mouse.js"
import { initRideFilter } from "./ride_filter_input.js"
import { initTouch } from "./touch.js"

export function initInput() {
    initMouse()
    initTouch()
    initRideFilter()

    colorInputSelect.addEventListener('change', () => {
        model.colorer.setStrat(+colorInputSelect.selectedOptions[0].value as ColorStrat)
    })

    citySelect.addEventListener('change', () => {
        model.setCitySelect(citySelect.selectedOptions[0].value as CitySelect)
    })

    showOptions.addEventListener('click', () => {
        sidebarExpanded.style.display = ''
        sidebarCollapsed.style.display = 'none'
    })

    hideOptions.addEventListener('click', () => {
        sidebarExpanded.style.display = 'none'
        sidebarCollapsed.style.display = ''
    })

    downloadPng.addEventListener('click', () => {
        const downloadLink = document.createElement('a')
        downloadLink.setAttribute('download', 'map.png')
        const dataURL = canvas.toDataURL('image/png')
        const url = dataURL.replace(/^data:image\/png/, 'data:application/octet-stream')
        downloadLink.setAttribute('href', url)
        downloadLink.click()
    })
}

