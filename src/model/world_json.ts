export type AABB = {
    minlat: number,
    maxlat: number,
    minlon: number,
    maxlon: number,
}

export type Node = {
    lat: number,
    lon: number,
    num_rides?: number,
}

export type Way = {
    name?: string,
    id: number,
    nodes: Node[],
    seen_percent?: number,
    num_rides?: number,
    bb: AABB,
}

export type Water = {
    name?: string,
    id: number,
    bank: Node[],
    closed: boolean,
    bb: AABB,
}

export type World = {
    paths: Way[]
    waters: Water[]
}
