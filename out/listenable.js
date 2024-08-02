export class Listenable {
    constructor() {
        this.listeners = [];
        this.trigger = this.triggerListeners.bind(this);
    }
    addListener(l) {
        this.listeners.push(l);
    }
    triggerListeners() {
        for (const l of this.listeners)
            l();
    }
}
