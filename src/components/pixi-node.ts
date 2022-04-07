import { Container, Graphics, InteractionEvent, Sprite, Text, Texture } from '@/plugins/pixijs';
import { Graph, Node, NodeId, Layout, Vector, Link, NodeData, LinkData } from '@/plugins/ngraph';
import { GraphConfig } from '@/options';

export class PixiNode extends Container {
    graphPosition: Vector;
    id: NodeId;
    label?: string;
    target: boolean;

    private config: GraphConfig;
    private layout: Layout<Graph<NodeData, LinkData>>;
    private isDragging = false;
    private dragEnded = false;
    private _shouldTap = false;

    constructor(graphNode: Node, layout: Layout<Graph<NodeData, LinkData>>, config: GraphConfig, texture?: Texture) {
        super();
        this.config = { ...config };
        this.label = graphNode.data.label;
        this.id = graphNode.id;
        this.target = graphNode.data.target || false;
        this.layout = layout;
        this.graphPosition = layout.getNodePosition(graphNode.id);

        // Create shape, label and icon and add them to the container

        const shape = this.createShape();
        this.addChild(shape);

        const label = this.createLabel();
        if (label) {
            label.x = -label.width / 2;
            if (texture) {
                label.y = -label.height / 3 / 4;
            } else {
                label.y = -label.height / 2;
            }

            this.addChild(label);
        }

        if (texture) {
            const icon = this.createIcon(texture);
            this.addChild(icon);
        }
    }

    get shouldTap(): boolean {
        return this._shouldTap;
    }

    get links(): Set<Link> | null {
        const node = this.layout.graph.getNode(this.id);
        return node?.links || null;
    }

    update(): void {
        this.setTransform(this.graphPosition.x, this.graphPosition.y);
    }

    isPinned(): boolean {
        const node = this.layout.graph.getNode(this.id);
        if (node) {
            return this.layout.isNodePinned(node);
        }
        return false;
    }

    pin(pos?: Vector): void {
        const node = this.layout.graph.getNode(this.id);
        if (!node) return;
        pos && this.layout.setNodePosition(this.id, pos.x, pos.y);
        this.layout.pinNode(node, true);
    }

    onDragStart(e: InteractionEvent): void {
        if (e.data.button == 0) {
            this.dragEnded = false;
            setTimeout(() => {
                if (!this.dragEnded) {
                    this.pin();
                    this.isDragging = true;
                    this._shouldTap = false;
                }
            }, 200);
        }
    }

    onDragEnd(_: InteractionEvent): void {
        this.dragEnded = true;
        if (!this.isDragging) {
            this._shouldTap = true;
        } else {
            this.isDragging = false;
        }
    }

    onDragMove(e: InteractionEvent): boolean {
        if (this.isDragging) {
            const graphPos = e.data.getLocalPosition(this.parent, undefined, e.data.global); // pixi.getGraphCoordinates(e.data.global.x, e.data.global.y);
            this.layout.setNodePosition(this.id, graphPos.x, graphPos.y);
            return true;
        }
        return false;
    }

    // Node creation methods

    /**
     * Creates a basic shape to represent a node.
     *
     * Supported shapes are circle, square and roundSquare.
     * @returns a {@link Graphics} object that represents a node to be rendered
     */
    protected createShape(): Graphics {
        const shape = new Graphics();
        const halfNode = this.config.nodeSize / 2;

        // if node is a target, color should be different
        shape.beginFill(this.target ? this.config.targetColor : this.config.nodeColor);
        switch (this.config.shape) {
            case 'circle':
                shape.drawCircle(0, 0, halfNode);
                break;

            case 'square':
                shape.drawRect(-halfNode, -halfNode, this.config.nodeSize, this.config.nodeSize);
                break;

            case 'roundSquare':
                shape.drawRoundedRect(-halfNode, -halfNode, this.config.nodeSize, this.config.nodeSize, this.config.nodeSize * 0.1);
                break;

            default:
                break;
        }

        shape.endFill();
        return shape;
    }

    /**
     * Creates a node label to be rendered inside the shape
     * @returns the {@link Text} to be rendered
     */
    protected createLabel(): Text | undefined {
        if (!this.label) return;
        let nodeText: Text;

        // Apply text transformation to the label if provided in the config
        const _label = this.config.labelTransform ? this.config.labelTransform(this.label) : this.label;
        if (!_label.length) return;

        // Create the Text object. TODO: Drop shadow and stroke values should be customizable?
        nodeText = new Text(_label, {
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize,
            fill: this.config.fontColor,
            align: 'center',
            dropShadow: true,
            dropShadowDistance: 2,
            strokeThickness: 1,
            stroke: this.target ? this.config.targetColor : this.config.fontStrokeColor,
        });

        // Increase default text resolution
        nodeText.resolution = 2;

        return nodeText;
    }

    /**
     * Creates an icon to be rendered inside the shape
     * @param texture the source image for the icon generation
     * @returns the {@link Sprite} to be rendered
     */
    protected createIcon(texture: Texture): Sprite {
        const icon = Sprite.from(texture);
        icon.width = this.config.nodeIconSize;
        icon.height = this.config.nodeIconSize;
        icon.anchor.set(0.5);

        // change icon position if there is a label
        if (this.children.find(c => c instanceof Text)) {
            icon.y = -this.config.nodeSize / 4.5;
        }

        // change texture color if config specified
        if (this.config.nodeIconColor) {
            icon.tint = this.config.nodeIconColor;
        }

        return icon;
    }
}
