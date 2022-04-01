import { Graph as NGraph, Link as NLink, LinkId, Node as NNode, NodeId } from "ngraph.graph";
import createLayout, { Layout as ForceLayout, PhysicsSettings, Vector } from "ngraph.forcelayout";
import { EventedType } from 'ngraph.events';
import fromJson, { JsonGraph, JsonLink, JsonNode } from 'ngraph.fromjson';

interface FixedLayout<T extends Graph<any, any>> extends Pick<ForceLayout<T>, 'getNodePosition' | 'setNodePosition' | 'getLinkPosition' | 'graph' | 'pinNode' | 'isNodePinned'> {
    step: undefined;
    lastMove: 0;
}

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

type Graph<T extends NodeData, U extends LinkData> = NGraph<T, U> & EventedType;
type Layout<T extends Graph<any, any>> = ForceLayout<T> | FixedLayout<T>;
type Node = NNode<NodeData>;
type Link = NLink<LinkData>;

export { EventedType, Graph, Link, LinkId, LinkData, Node, NodeId, NodeData, Layout, PhysicsSettings, Vector, JsonGraph, JsonLink, JsonNode, fromJson, createLayout };
