import { Graph as NGraph, Link as NLink, LinkId, Node as NNode, NodeId } from 'ngraph.graph';
import createLayout, { Layout as ForceLayout, PhysicsSettings, Vector } from 'ngraph.forcelayout';
import eventify, { EventedType } from 'ngraph.events';
import fromJson, { JsonGraph, JsonLink, JsonNode } from 'ngraph.fromjson';

interface FixedLayout<T extends Graph<any, any>>
    extends Pick<ForceLayout<T>, 'getNodePosition' | 'setNodePosition' | 'getLinkPosition' | 'graph' | 'pinNode' | 'isNodePinned' | 'lastMove'> {
    step: undefined;
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
type Layout<T extends Graph<any, any>> = (ForceLayout<T> | FixedLayout<T>) & EventedType;
type Node = NNode<NodeData>;
type Link = NLink<LinkData>;
type NodeEventDetail<T extends NodeData = NodeData> = {
    id: NodeId;
    data: T;
    x: number;
    y: number;
};

type GraphChange = {
    changeType: 'add' | 'remove';
    node?: Node;
    link?: Link;
}

export {
    EventedType,
    FixedLayout,
    Graph,
    GraphChange,
    Link,
    LinkId,
    LinkData,
    Node,
    NodeId,
    NodeData,
    NodeEventDetail,
    // NodeListener,
    Layout,
    PhysicsSettings,
    Vector,
    JsonGraph,
    JsonLink,
    JsonNode,
    fromJson,
    createLayout,
    eventify
};
