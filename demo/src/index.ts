import { createGraph } from 'connexio';
import { sample, sampleFixed, addSample } from './sample';

const mode: 'force' | 'fixed' = 'force';
const data = {
    force: sample,
    fixed: sampleFixed
};

const graph = createGraph(document.body, {
    labelTransform: label => label.split(' ')[0],
    layout: mode
});
document.body.style.height = '100vh';
document.body.style.margin = '0';

document.body.addEventListener('nodetap', e => {
    const elem = document.getElementById('label')!;
    elem.innerText = e.detail.data.label || '';
    elem.style.left = e.detail.x + 10 + 'px';
    elem.style.top = e.detail.y + 10 + 'px';
});
document.oncontextmenu = () => (false);
document.body.addEventListener('noderighttap', e => {
    console.log(e.detail);
});

const nodeTransformer = (node: typeof sample.nodes[0]) => {
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
};

const linkTransformer = (link: typeof sample.links[0]) => {
    return {
        fromId: link.sourceId,
        toId: link.targetId,
        data: {
            label: link.label,
            fromName: link.source,
            toName: link.target,
        },
    };
};

const btnAdd = document.getElementById('btnAdd');
btnAdd!.addEventListener('click', _ => {
    graph.addData(addSample, {
        nodeTransformer,
        linkTransformer,
    });
});

graph.initGraph(data[mode], {
    nodeTransformer,
    linkTransformer,
});
