import { NodeId } from "@/plugins/ngraph";

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
    nodeColor: 0x0099ff,
    nodeIconColor: null,
    nodeSize: 40,
    nodeTypes: {},
    shape: 'circle',
    targetColor: 0x9f9600,
};
