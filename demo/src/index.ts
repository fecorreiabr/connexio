import createGraph from 'connexio';
import { sample, sampleFixed } from './sample';

const mode: 'force' | 'fixed' = 'fixed';

const graph = createGraph(document.body, {
    labelTransform: label => label.split(' ')[0],
    layout: mode
});
document.body.style.height = '100vh';
document.body.style.margin = '0';

graph.initGraph(mode === 'fixed' ? sampleFixed : sample, {
    nodeTransformer: node => {
        let data: any = {};
        if (node.position) {
            data.position = {
                x: node.position[0],
                y: node.position[1]
            }
        }
        return {
            id: node.id,
            data: {
                type: node.type,
                label: node.label,
                target: node.id === 1 || undefined,
                ...data
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
