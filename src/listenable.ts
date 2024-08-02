
export type Listener = () => void;

export abstract class Listenable {
    listeners: Listener[] = []

    protected readonly trigger = this.triggerListeners.bind(this)

    addListener(l: Listener) {
        this.listeners.push(l)
    }

    protected triggerListeners() {
        for (const l of this.listeners) l()
    }
}