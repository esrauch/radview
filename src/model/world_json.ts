

export type Node = {
    lat: number,
    lon: number
}

export type Way = {
    name?: string,
    id: number,
    nodes: Node[],
    seen_amount?: number,
}

export type Water = {
    name?: string,
    id: number,
    bank: Node[],
    closed: boolean,
}

export type World = {
    paths: Way[]
    waters: Water[]
}