import { EventedType, eventify, FixedLayout, Graph, GraphChange, Link, LinkId, Node, NodeData, NodeId, Vector } from '@/plugins/ngraph';

export default function createLayout<T extends Graph<NodeData & { position?: Vector }, any>>(graph: T): FixedLayout<T> & EventedType {
    if (!graph) {
        throw new Error('Graph must not be undefined');
    }

    const nodeBodies = new Map<NodeId, Body>();
    const springs = new Map<LinkId, { from: Body; to: Body }>();
    graph.forEachNode(node => initBody(node.id));
    graph.forEachLink(link => initSpring(link));
    graph.on('changed', onGraphChanged);

    const layout = {
        getNodePosition: function (nodeId: NodeId) {
            return getInitializedBody(nodeId).pos;
        },
        setNodePosition: function (nodeId: NodeId, x: number, y: number) {
            const body = getInitializedBody(nodeId);
            body.setPosition(x, y);
        },
        getLinkPosition: function (linkId: LinkId) {
            const spring = getInitializedSpring(linkId);
            return {
                from: spring.from.pos,
                to: spring.to.pos,
            };
        },
        graph: graph,
        step: undefined,
        lastMove: 0,
        pinNode: function (_: Node, __: boolean) {
            // noop
        },
        isNodePinned: function (_: Node) {
            return true;
        },
    };

    return eventify(layout);

    function initBody(nodeId: NodeId) {
        let body = nodeBodies.get(nodeId);
        if (!body) {
            const node = graph.getNode(nodeId);
            if (!node) {
                throw new Error('Unknown node id');
            }

            let pos = node.data.position;
            if (!pos) {
                // TODO: random position?
                pos = {
                    x: 0,
                    y: 0,
                };
            }

            body = new Body(pos);
            nodeBodies.set(nodeId, body);
        }
    }

    function getInitializedBody(nodeId: NodeId): Body {
        let body = nodeBodies.get(nodeId);
        if (!body) {
            initBody(nodeId);
            body = nodeBodies.get(nodeId);
        }
        return body!;
    }

    function initSpring(link: Link) {
        let spring = springs.get(link.id);
        if (!spring) {
            const fromBody = getInitializedBody(link.fromId),
                toBody = getInitializedBody(link.toId);
            spring = {
                from: fromBody,
                to: toBody,
            };
            springs.set(link.id, spring);
        }
    }

    function getInitializedSpring(linkId: LinkId) {
        let spring = springs.get(linkId);
        if (!spring) {
            graph.forEachLink(link => link.id === linkId && initSpring(link));
            spring = springs.get(linkId);
        }
        return spring!;
    }

    function onGraphChanged(changes: GraphChange[]) {
        changes.forEach(change => {
            switch (change.changeType) {
                case 'add':
                    if (change.node) {
                        initBody(change.node.id);
                    }
                    if (change.link) {
                        initSpring(change.link);
                    }
                    break;

                case 'remove':
                    if (change.node) {
                        nodeBodies.delete(change.node.id);
                    }
                    if (change.link) {
                        springs.delete(change.link.id);
                    }
                    break;

                default:
                    break;
            }
        });
    }
}

class Body {
    readonly pos: Vector;

    constructor(pos: Vector) {
        this.pos = pos;
    }

    setPosition(x: number, y: number) {
        this.pos.x = x;
        this.pos.y = y;
    }
}
