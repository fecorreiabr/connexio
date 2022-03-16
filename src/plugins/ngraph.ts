import { Graph as NGraph, Link as NLink, LinkId, Node as NNode, NodeId } from "ngraph.graph";
import { Layout as ForceLayout, Vector } from "ngraph.forcelayout";

interface Layout<T extends Graph> extends Pick<ForceLayout<T>, 'getNodePosition' | 'setNodePosition' | 'getLinkPosition' | 'graph' | 'pinNode' | 'isNodePinned'> {}

type NodeData = {
    type: string;
    label?: string;
    target?: boolean;
};

type LinkData = {
    uuid: string;
    groupId: string;
    label?: string;
};

type Graph = NGraph<NodeData, LinkData>;
type Node = NNode<NodeData>;
type Link = NLink<LinkData>;

export { Graph, Link, LinkId, Node, NodeId, Layout, Vector };
