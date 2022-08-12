import { GraphConfig } from '@/options';
import { Graph, GraphChange, Layout, Link, LinkData, LinkId, Node, NodeData, NodeId } from '@/plugins/ngraph';
import { Application, Container, InteractionEvent, Texture } from '@/plugins/pixijs';
import { PixiLink } from './pixi-link';
import { PixiNode } from './pixi-node';

export class PixiGraph extends Application {
    config: GraphConfig;
    layout: Layout<Graph<NodeData, LinkData>>;
    textures?: Record<string, Texture>;

    private nodes!: Map<NodeId, PixiNode>; // refs to the nodes drawn on the pixi app
    private links!: Map<LinkId, PixiLink>; // refs to the links drawn on the pixi app
    private nodesContainer!: Container; // container that holds the node graphics
    private linksContainer!: Container; // container that holds the link graphics
    private targets!: Set<NodeId>; // refs to the node ids that are targets

    animationControl?: AnimationControl;
    rendererStarted = false;

    constructor(containerElem: HTMLElement, graphConfig: GraphConfig, layout: Layout<Graph<NodeData, LinkData>>) {
        super({
            width: containerElem.clientWidth,
            height: containerElem.clientHeight,
            backgroundColor: graphConfig.backgroundColor,
            antialias: true,
        });
        containerElem.appendChild(this.view);
        this.resizeTo = containerElem;
        this.resetView();

        this.config = graphConfig;
        this.layout = layout;
        this.loadTextures();

        // Create containers
        this.createContainers();

        this.initNodes();
        this.initLinks();

        // node listeners
        this.nodesContainer.on('nodetap', (node: PixiNode, e: InteractionEvent) => this.dispatchNodeEvent('nodetap', node, e));
        this.nodesContainer.on('noderighttap', (node: PixiNode, e: InteractionEvent) => this.dispatchNodeEvent('noderighttap', node, e));

        // link listeners
        this.linksContainer.on('childRemoved', (link: PixiLink) => {
            this.links.delete(link.id);
            link.destroy({ children: true });
        });

        this.registerGraphChangeEvents();
    }

    /**
     * Starts the graph renderer, thus drawing it on the screen
     */
    public startRenderer(): void {
        if (this.rendererStarted) return;
        // initial graphics update
        this.updateGraphics();

        if (this.layout.step) {
            this.animationControl = new AnimationControl(this.nodes.size);
            this.ticker.add(() => {
                this.updateLayout();
                this.render();
            });
            this.layout.on('drag', () => this.animationControl!.reset());
        } else {
            this.ticker.add(() => this.render());
            this.layout.on('drag', () => this.updateGraphics());
        }
        this.rendererStarted = true;
    }

    reset(): void {
        // TODO:
        this.resetView();
    }

    /**
     * Resets zoom and center stage
     */
    resetView(): void {
        const stage = this.stage;
        let width: number, height: number;
        if (this.resizeTo instanceof HTMLElement) {
            width = this.resizeTo.clientWidth;
            height = this.resizeTo.clientHeight;
        } else {
            width = this.resizeTo.innerWidth;
            height = this.resizeTo.innerHeight;
        }
        stage.position.x = width / 2;
        stage.position.y = height / 2;
        stage.scale.x = 1;
        stage.scale.y = 1;
    }

    private loadTextures(): void {
        for (const k in this.config.nodeTypes) {
            const v = this.config.nodeTypes[k];
            if (v.img) {
                const img = v.img;
                const texture = Texture.from(img); // TODO: treat error if no file found
                if (!this.textures) this.textures = {};
                this.textures[k] = texture;
            }
        }
    }

    /**
     * Creates the PIXI Containers and adds listeners to them
     */
    private createContainers(): void {
        this.nodesContainer = new Container();
        this.linksContainer = new Container();
        const mainContainer = new Container();
        mainContainer.interactive = true;
        mainContainer.addChild(this.linksContainer, this.nodesContainer);
        this.stage.addChild(this.linksContainer, this.nodesContainer);

        // Nodes container events
        this.nodesContainer.on('childAdded', (node: PixiNode) => {
            this.nodes.set(node.id, node);
            if (node.target) this.targets.add(node.id);
        });
        this.nodesContainer.on('removedFrom', (node: PixiNode) => {
            this.nodes.delete(node.id);
            this.targets.delete(node.id);
        });

        // Links container events
        this.linksContainer.on('childAdded', (link: PixiLink) => {
            this.links.set(link.id, link);
        });
        this.linksContainer.on('removedFrom', (link: PixiLink) => {
            this.links.delete(link.id);
        });
    }

    /**
     * Creates the nodes for the initial graph
     */
    private initNodes(): void {
        this.nodes = new Map();
        this.targets = new Set();
        this.layout.graph.forEachNode(node => {
            this.addNode(node);
        });

        this.pinMainNode(); // TODO: setTimeout?
    }

    /**
     * Creates and adds a single node to the PIXI Application
     * @param graphNode node to add
     */
    private addNode(graphNode: Node): void {
        const node = new PixiNode(graphNode, this.layout, this.config, this.textures?.[graphNode.data.type]);
        this.nodesContainer.addChild(node);

        // if (node.target) { // TODO: chek if necessary
        //     this.targets.add(id);
        // }
    }

    /**
     * Remove a node from the graph based on its id
     * @param nodeId  node to remove
     */
    private removeNode(graphNode: Node): void {
        const node = this.nodes.get(graphNode.id)
        if (node) {
            this.nodes.delete(node.id);
            this.nodesContainer.removeChild(node);
            node.destroy({ children: true });
            // TODO: emit node removed?
        }
    }

    private removeLink(graphLink: Link): void {
        const link = this.links.get(graphLink.data.groupId);
        if (link) {
            link.removeGraphLink(graphLink);
        }
    }

    /**
     * Fixes the "main node" in the screen, in order to keep the graph in the center of the stage.
     *
     * The main node is either:
     * * the only target, if just one target node is provided
     * * the target which contains the greater amount of incoming/outgoing links
     * * TODO: calculate central node if no targets are present
     */
    private pinMainNode(): void {
        if (!this.targets.size) return;

        let mainNode: PixiNode;
        if (this.targets.size === 1) {
            const id = this.targets.values().next().value;
            const node = this.nodes.get(id);
            if (!node) return;
            mainNode = node;
        } else {
            const targetNodes: PixiNode[] = [];
            this.targets.forEach(t => {
                const node = this.nodes.get(t);
                node && targetNodes.push(node);
            });

            // order by links size DESC
            targetNodes.sort((n1: PixiNode, n2: PixiNode) => {
                return (n2.links?.size || 0) - (n1.links?.size || 0);
            });

            mainNode = targetNodes[0];
        }

        if (!mainNode.isPinned()) {
            mainNode.pin({ x: 0, y: 0 });
        }
    }

    /**
     * Creates the links for the initial graph
     */
    private initLinks(): void {
        this.links = new Map();
        this.layout.graph.forEachLink(link => {
            this.addLink(link);
        });
    }

    /**
     * Creates and adds a link to the PIXI Application
     * @param graphLink link to add
     */
    private addLink(graphLink: Link): void {
        let link = this.links.get(graphLink.data.groupId);
        if (link) {
            link.addGraphLink(graphLink);
            return;
        }
        link = new PixiLink(graphLink, this.layout, this.config);
        this.linksContainer.addChild(link);
    }

    /**
     * Updates the layout calling the step function when necessary. Called only when ForceLayout is used.
     * @returns
     */
    private updateLayout(): void {
        if (!this.animationControl) return;
        // Step only increases while the amount of movement during the last operation is less than the
        // limit calculated by AnimationControl, otherwise it is set to zero.
        if (this.layout.lastMove < this.animationControl.movesLimit) {
            this.animationControl.step();
        } else {
            this.animationControl.reset();
        }

        // Perform operations on the last step before stopping the animation
        if (this.animationControl.lastStep) {
            //} || Date.now() === animTimeLimit) { // TODO: revisar a comparação de limite de tempo
            // pin target nodes on the last step
            if (this.targets.size) {
                this.targets.forEach(id => {
                    const node = this.layout.graph.getNode(id);
                    !!node && this.layout.pinNode(node, true);
                });
            }
        }

        if (this.animationControl.stopped) {
            // || Date.now() > animTimeLimit) {
            return;
        }
        this.layout.step!();
        this.updateGraphics();
    }

    private updateGraphics(): void {
        this.nodes.forEach(node => {
            node.update(); // TODO: passar p o fire
        });
        this.links.forEach(link => {
            link.update();
        });
    }

    dispatchEvent<K extends keyof ElementEventMap>(type: K, args: CustomEventInit<ElementEventMap[K] extends CustomEvent<infer X> ? X : never>): void {
        const event = new CustomEvent(type, args);
        this.resizeTo.dispatchEvent(event);
    }

    private dispatchNodeEvent(type: 'nodetap' | 'noderighttap', node: PixiNode, e: InteractionEvent): void {
        const graphNode = this.layout.graph.getNode(node.id);
        if (!graphNode) return;
        const evt = e.data.originalEvent as MouseEvent;
        evt.preventDefault();
        this.dispatchEvent(type, {
            bubbles: true,
            detail: {
                id: node.id,
                data: graphNode.data,
                x: evt.clientX,
                y: evt.clientY
            }
        })
    }

    private registerGraphChangeEvents(): void {
        this.layout.graph.on('changed', (changes: GraphChange[]) => {
            changes.forEach(change => {
                switch (change.changeType) {
                    case 'add':
                        change.node && this.addNode(change.node);
                        change.link && this.addLink(change.link);
                        this.pinMainNode();
                        // this.stepCounter = 0;
                        break;

                    case 'remove':
                        change.node && this.removeNode(change.node);
                        change.link && this.removeLink(change.link);

                        break;

                    default:
                        break;
                }
            });
            if (this.animationControl) {
                this.animationControl.update(this.nodes.size);
            }
        });
    }
}

class AnimationControl {
    private _nodeCount: number;
    private _movesLimit!: number;
    private _timeStart!: number;
    private _timeLimit!: number;
    private _needsRecalc!: boolean;
    private _stepCountLimit = 100;
    private _stepCounter = 0;

    constructor(nodeCount: number) {
        this._nodeCount = nodeCount;
        this.calculate();
    }

    public get movesLimit(): number {
        return this._movesLimit;
    }

    public get timeStart(): number {
        return this._timeStart;
    }

    public get timeLimit(): number {
        return this._timeLimit;
    }

    public get needsRecalc(): boolean {
        return this._needsRecalc;
    }

    public get stepCountLimit(): number {
        return this._stepCountLimit;
    }

    public get stepCounter(): number {
        return this._stepCounter;
    }

    public get lastStep(): boolean {
        return this.stepCounter == this.stepCountLimit;
    }

    public get stopped(): boolean {
        return this.stepCounter >= this.stepCountLimit;
    }

    calculate(): void {
        this._movesLimit = Math.round(Math.pow(this._nodeCount, 2) * 0.04);
        this._timeStart = Date.now();
        this._timeLimit = this._timeStart + 20000;
        this._needsRecalc = false;
    }

    step(): void {
        this._stepCounter++;
    }

    reset(): void {
        this._stepCounter = 0;
    }

    update(nodeCount: number): void {
        this._nodeCount = nodeCount;
        this.calculate();
        this.reset();
    }
}
