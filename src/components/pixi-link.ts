import { GraphConfig } from '@/options';
import { Graph, Layout, Link, LinkData, NodeData, Vector } from '@/plugins/ngraph';
import { Graphics, Polygon } from '@/plugins/pixijs';

interface Edge {
    position: {
        from: Vector;
        to: Vector;
    };
    arrow?: {
        start: Vector;
        nodes: Vector[];
    };
}

export class PixiLink extends Graphics {
    id: string;
    sourceLinks: string[];
    edges: Record<string, Edge>;
    fromPos?: Vector;

    private config: Pick<GraphConfig, 'arrowColor' | 'arrowSize' | 'lineHitWidth' | 'nodeRadius' | 'selfLinkDistance' | 'selfLinkRadius'>;
    private layout: Layout<Graph<NodeData, LinkData>>;
    private hitAreaPolygon: Polygon;
    private _selfLink: boolean;

    /**
     *
     */
    constructor(graphLink: Link, layout: Layout<Graph<NodeData, LinkData>>, config: GraphConfig) {
        super();
        this.id = graphLink.data.groupId;
        this.layout = layout;
        this.config = (({ arrowColor, arrowSize, lineHitWidth, nodeRadius, selfLinkDistance, selfLinkRadius }) => ({
            arrowColor,
            arrowSize,
            lineHitWidth,
            nodeRadius,
            selfLinkDistance,
            selfLinkRadius,
        }))(config);
        this._selfLink = graphLink.fromId === graphLink.toId;
        this.sourceLinks = [graphLink.data.uuid];
        this.edges = {
            [graphLink.id]: { position: layout.getLinkPosition(graphLink.id) },
        };
        this.interactive = true;
        this.buttonMode = true;
        this.hitAreaPolygon = new Polygon();
        this.hitArea = this.hitAreaPolygon;
    }

    get selfLink() {
        return this._selfLink;
    }

    addGraphLink(graphLink: Link): void {
        if (graphLink.data.groupId !== this.id) throw new Error('Link must be added to the same group');
        this.sourceLinks.push(graphLink.data.uuid);
        this.edges[graphLink.id] = {
            position: this.layout.getLinkPosition(graphLink.id),
        };
    }

    /**
     * Removes a {@link Link} from the graphic. Also removes the graphic from the container if there are no more edges to be rendered.
     * @param graphLink the link to be removed
     * @returns true if there are no more edges to render, false otherwise
     */
    removeGraphLink(graphLink: Link): boolean {
        const link = this.sourceLinks.findIndex(l => l === graphLink.data.uuid);
        if (link >= 0) {
            this.sourceLinks.splice(link, 1);
            // if there are no more links with the same id (same from-to), remove the edge
            if (!this.sourceLinks.includes(graphLink.id)) delete this.edges[graphLink.id];

            if (!Object.keys(this.edges).length) {
                //no more edges, destroy graphic
                this.parent.removeChild(this);
                this.destroy({ children: true });
                // this.links.delete(graphLink.data.groupId); // TODO: remove from control list
                return true;
            }
        }

        return false;
    }

    update(): void {
        this.calculateEdges();
        this.drawEdges();
    }

    protected calculateEdges(): void {
        let hitAreaCalculated = false;
        for (const k in this.edges) {
            const edge = this.edges[k];

            // get source coords
            let from: Vector = {
                x: edge.position.from.x,
                y: edge.position.from.y,
            };

            // alternate source coords calc if link to itself
            if (this.selfLink) {
                if (this.fromPos) {
                    from = this.fromPos;
                } else {
                    this.fromPos = from;
                }
                from.x = edge.position.to.x - this.config.selfLinkDistance;
                from.y = edge.position.to.y;
            }

            // calculate end coords
            // TODO: calculate based on node shape
            const angle = Math.atan2(edge.position.to.y - from.y, edge.position.to.x - from.x);
            const end: Vector = {
                x: -Math.cos(angle) * this.config.nodeRadius + edge.position.to.x,
                y: -Math.sin(angle) * this.config.nodeRadius + edge.position.to.y,
            };

            // calculate hitArea only once
            if (!hitAreaCalculated) {
                let offset = this.config.nodeRadius;
                if (this.selfLink) {
                    offset = 0;
                }
                const traverseAngle = angle - (90 * Math.PI) / 180;
                const sizeX = Math.cos(traverseAngle) * this.config.lineHitWidth;
                const sizeY = Math.sin(traverseAngle) * this.config.lineHitWidth;
                const start = {
                    x: Math.cos(angle) * offset + from.x,
                    y: Math.sin(angle) * offset + from.y,
                };
                this.hitAreaPolygon.points.splice(0);
                this.hitAreaPolygon.points.push(
                    start.x + sizeX,
                    start.y + sizeY, //p1
                    end.x + sizeX,
                    end.y + sizeY, //p2
                    end.x - sizeX,
                    end.y - sizeY, //p3
                    start.x - sizeX,
                    start.y - sizeY //p4
                );
                hitAreaCalculated = true; // TODO: check
            }

            // calculate arrow points
            edge.arrow = {
                start: end,
                nodes: [
                    {
                        x: -Math.cos(angle - (20 * Math.PI) / 180) * this.config.arrowSize + end.x,
                        y: -Math.sin(angle - (20 * Math.PI) / 180) * this.config.arrowSize + end.y,
                    },
                    {
                        x: -Math.cos(angle + (20 * Math.PI) / 180) * this.config.arrowSize + end.x,
                        y: -Math.sin(angle + (20 * Math.PI) / 180) * this.config.arrowSize + end.y,
                    },
                ],
            };
        }
    }

    protected drawEdges(): void {
        this.clear();
        let lineDrawn = false;
        for (const k in this.edges) {
            const edge = this.edges[k];

            // draw line only once
            if (!lineDrawn) {
                if (!this.fromPos) {
                    this.moveTo(edge.position.from.x, edge.position.from.y);
                } else {
                    this.moveTo(this.fromPos.x, this.fromPos.y);
                }
                this.lineStyle(1, 0x000000, 0.3);
                this.lineTo(edge.position.to.x, edge.position.to.y);
                if (this.selfLink && this.fromPos) {
                    this.lineStyle(0);
                    this.beginFill(this.config.arrowColor);
                    this.drawCircle(this.fromPos.x, this.fromPos.y, this.config.selfLinkRadius);
                }
                lineDrawn = true;
            }

            // draw arrow
            if (edge.arrow) {
                this.moveTo(edge.arrow.start.x, edge.arrow.start.y);
                this.lineStyle(0);
                this.beginFill(this.config.arrowColor);
                edge.arrow.nodes.forEach(node => {
                    this.lineTo(node.x, node.y);
                });
            }

            this.closePath();
            this.endFill();
        }
    }
}
