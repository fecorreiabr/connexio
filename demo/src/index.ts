import createGraph from 'connexio';
import { sample } from './sample';

const graph = createGraph(document.body, {
    labelTransform: label => label.split(' ')[0],
});
document.body.style.height = '100vh';
document.body.style.margin = '0';

graph.initGraph(sample, {
    nodeTransformer: node => {
        return {
            id: node.id,
            data: {
                type: node.type,
                label: node.label,
                target: node.id === 1 || undefined,
            },
        };
    },
    linkTransformer: link => {
        return {
            fromId: link.sourceId,
            toId: link.targetId,
            data: {
                label: link.label,
                fromName: link.source,
                toName: link.target,
            },
        };
    },
});

// document.addEventListener('DOMContentLoad', () => {
//     console.log('Init graph...')

// })
