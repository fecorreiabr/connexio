type Sample = {
    nodes: {id: number, label: string, type: string, position?: number[]}[],
    links: {source: string, sourceId: number, target: string, targetId: number, label: string}[],
    targets: number[]
}
export const sample: Sample = {
    nodes: [
        { id: 1, label: 'Liam Wright', type: 'Person' },
        { id: 2, label: 'Justin Wright', type: 'Person' },
        { id: 3, label: 'Jonathan Wright', type: 'Person' },
        { id: 4, label: 'Amanda Wright', type: 'Person' },
        { id: 5, label: 'Anne Wright', type: 'Person' },
    ],
    links: [
        { source: 'Liam Wright', sourceId: 1, target: 'Anne Wright', targetId: 5, label: 'brother' },
        { source: 'Anne Wright', sourceId: 5, target: 'Liam Wright', targetId: 1, label: 'wife' },
        { source: 'Liam Wright', sourceId: 1, target: 'Justin Wright', targetId: 2, label: 'brother' },
        { source: 'Justin Wright', sourceId: 2, target: 'Liam Wright', targetId: 1, label: 'brother' },
        { source: 'Justin Wright', sourceId: 2, target: 'Jonathan Wright', targetId: 3, label: 'father' },
        { source: 'Jonathan Wright', sourceId: 3, target: 'Justin Wright', targetId: 2, label: 'son' },
        { source: 'Jonathan Wright', sourceId: 3, target: 'Liam Wright', targetId: 1, label: 'nephew' },
        { source: 'Liam Wright', sourceId: 1, target: 'Jonathan Wright', targetId: 3, label: 'uncle' },
        { source: 'Jonathan Wright', sourceId: 3, target: 'Amanda Wright', targetId: 4, label: 'husband' },
        { source: 'Amanda Wright', sourceId: 4, target: 'Jonathan Wright', targetId: 3, label: 'wife' },
        { source: 'Amanda Wright', sourceId: 4, target: 'Justin Wright', targetId: 2, label: 'daughter_in_law' },
        { source: 'Justin Wright', sourceId: 2, target: 'Amanda Wright', targetId: 4, label: 'father_in_law' },
    ],
    targets: [3],
};

export const sampleFixed: Sample = {
    nodes: [
        { id: 1, label: 'Liam Wright', type: 'Person', position: [0, 0] },
        { id: 2, label: 'Justin Wright', type: 'Person', position: [0, 100] },
        { id: 3, label: 'Jonathan Wright', type: 'Person', position: [100, 100] },
        { id: 4, label: 'Amanda Wright', type: 'Person', position: [-100, 200] },
        { id: 5, label: 'Anne Wright', type: 'Person', position: [100, 0] },
    ],
    links: [
        { source: 'Liam Wright', sourceId: 1, target: 'Anne Wright', targetId: 5, label: 'brother' },
        { source: 'Anne Wright', sourceId: 5, target: 'Liam Wright', targetId: 1, label: 'wife' },
        { source: 'Liam Wright', sourceId: 1, target: 'Justin Wright', targetId: 2, label: 'brother' },
        { source: 'Justin Wright', sourceId: 2, target: 'Liam Wright', targetId: 1, label: 'brother' },
        { source: 'Justin Wright', sourceId: 2, target: 'Jonathan Wright', targetId: 3, label: 'father' },
        { source: 'Jonathan Wright', sourceId: 3, target: 'Justin Wright', targetId: 2, label: 'son' },
        { source: 'Jonathan Wright', sourceId: 3, target: 'Liam Wright', targetId: 1, label: 'nephew' },
        { source: 'Liam Wright', sourceId: 1, target: 'Jonathan Wright', targetId: 3, label: 'uncle' },
        { source: 'Jonathan Wright', sourceId: 3, target: 'Amanda Wright', targetId: 4, label: 'husband' },
        { source: 'Amanda Wright', sourceId: 4, target: 'Jonathan Wright', targetId: 3, label: 'wife' },
        { source: 'Amanda Wright', sourceId: 4, target: 'Justin Wright', targetId: 2, label: 'daughter_in_law' },
        { source: 'Justin Wright', sourceId: 2, target: 'Amanda Wright', targetId: 4, label: 'father_in_law' },
    ],
    targets: [3],
};