import { GraphConfig } from '@/options';
import { Graph, Layout, Link, LinkData, LinkId, Node, NodeData, NodeId } from '@/plugins/ngraph';
import { Application, Container, Texture } from '@/plugins/pixijs';
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

        // TODO: add node listeners
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
        }

        this.ticker.add(() => {
            if (this.layout.step) this.updateLayout();
            this.render();
        });
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
        if (this.animationControl.needsRecalc) {
            // TODO: update when nodes changed
            this.animationControl.calculate(this.nodes.size);
        }
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
}

class AnimationControl {
    private _movesLimit!: number;
    private _timeStart!: number;
    private _timeLimit!: number;
    private _needsRecalc!: boolean;
    private _stepCountLimit = 100;
    private _stepCounter = 0;

    constructor(nodeCount: number) {
        this.calculate(nodeCount);
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

    calculate(nodeCount: number): void {
        this._movesLimit = Math.round(Math.pow(nodeCount, 2) * 0.04);
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
}
