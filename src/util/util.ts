

/**
 * Note: The reason for this util fn is Math.min(...n) crashes on arrays that are too large
 */
export function min(n: number[]): number {
    let min = Infinity
    for (let i = 0; i < n.length; ++i)
        if (n[i] < min) min = n[i]
    return min
}

export function max(n: number[]): number {
    let max = -Infinity
    for (let i = 0; i < n.length; ++i)
        if (n[i] > max) max = n[i]
    return max
}