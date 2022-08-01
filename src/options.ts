import { NodeId } from '@/plugins/ngraph';

export type NodeType = {
    desc: string;
    idLabel?: string;
    img?: string;
    formatId?: (id: NodeId) => string;
};

export type GraphOptions = {
    actionIconsColor: number;
    backgroundColor: number;
    fontColor: number;
    fontFamily: string;
    fontSize: number;
    fontStrokeColor: number;
    labelTransform: ((label: string) => string) | null;
    layout: 'force' | 'fixed';
    nodeColor: number;
    nodeIconColor: number | null;
    nodeSize: number;
    nodeTypes: Record<string, NodeType>;
    shape: 'circle' | 'square' | 'roundSquare';
    targetColor: number;
};

type CalculatedParams = {
    nodeRadius: number;
    arrowSize: number;
    selfLinkRadius: number;
    selfLinkDistance: number;
    lineHitWidth: number;
    nodeIconSize: number;
    arrowColor: number;
};

export type GraphConfig = GraphOptions & CalculatedParams;

export const defaultOptions: GraphOptions = {
    actionIconsColor: 0x0099ff,
    backgroundColor: 0xf5f5f5,
    fontColor: 0xffffff,
    fontFamily: 'Arial',
    fontSize: 12,
    fontStrokeColor: 0x0099ff,
    labelTransform: null,
    layout: 'force',
    nodeColor: 0x0099ff,
    nodeIconColor: null,
    nodeSize: 40,
    nodeTypes: {},
    shape: 'circle',
    targetColor: 0x9f9600,
};

export function createConfig(options?: Partial<GraphOptions>): GraphConfig {
    const config = {
        ...defaultOptions,
        ...options,
    };

    const arrowSize = config.nodeSize / 3;
    return {
        ...config,
        arrowColor: calculateArrowColor(config.backgroundColor),
        arrowSize,
        lineHitWidth: arrowSize * 0.68404028665,
        nodeIconSize: config.nodeSize * 0.5,
        nodeRadius: config.nodeSize / 2,
        selfLinkRadius: config.nodeSize / 8,
        selfLinkDistance: config.nodeSize * 2,
    };
}

function calculateArrowColor(backgroundColor: number): number {
    return (
        Math.floor(((backgroundColor & 0xff0000) >> 16) * 0.7) * 0x10000 +
        Math.floor(((backgroundColor & 0x00ff00) >> 8) * 0.7) * 0x100 +
        Math.floor((backgroundColor & 0x0000ff) * 0.7)
    );
}
