import { PixiGraph } from './components/pixi-graph';
import globalInput from './input/global-input';
import { createConfig, GraphConfig, GraphOptions } from './options';
import {
    createLayout,
    fromJson,
    Graph,
    JsonGraph,
    JsonLink,
    JsonNode,
    Layout,
    LinkData,
    NodeData,
    PhysicsSettings,
} from './plugins/ngraph';
import createFixedLayout from './layout/fixed-layout';
import { hash } from './util/hash';

type JsonData<X, Y> = JsonGraph<JsonNode<NodeData> | X, JsonLink<LinkData> | Y> | string;

type JsonTransformers<T extends NodeData, U extends LinkData, X, Y> = {
    nodeTransformer: (node: X) => JsonNode<T>;
    linkTransformer: (link: Y) => JsonLink<Partial<U>>;
};

export default function createGraph(containerElem: HTMLElement, options?: Partial<GraphOptions>) {
    const config: GraphConfig = createConfig(options);
    let layout: Layout<Graph<NodeData, LinkData>>;
    let graph: Graph<NodeData, LinkData>;
    let pixiGraph: PixiGraph;
    let physicsSettings: Omit<PhysicsSettings, 'adaptiveTimeStepWeight' | 'dimensions' | 'debug'>;

    const api = {
        initGraph,
        addData,
    };

    return api;

    function initGraph<X, Y>(jsonData: JsonData<X, Y>, transformers?: JsonTransformers<NodeData, LinkData, X, Y>): void {
        const _graph = graphFromJson(jsonData, transformers);
        if (_graph) {
            graph = _graph;
        }

        if (config.layout === 'force') {
            // Force Layout
            physicsSettings = createPhysicsSettings(config.nodeSize);
            layout = createLayout(graph, physicsSettings);
        } else if (config.layout === 'fixed') {
            // Fixed Layout
            layout = createFixedLayout(graph);
        }

        pixiGraph = new PixiGraph(containerElem, config, layout);
        pixiGraph.startRenderer();
        globalInput(pixiGraph);
    }

    function addData<X, Y>(jsonData: JsonData<X, Y>): void {
        if (!graph) {
            initGraph(jsonData);
            return;
        }

        // generate nodes and links
        const _graph = graphFromJson(jsonData);
        if (!_graph) throw 'Error when adding data';

        // add nodes and links to graph in a 'bulk' update
        graph.beginUpdate();
        _graph.forEachNode(node => {
            graph.addNode(node.id, node.data);
        });
        _graph.forEachLink(link => {
            graph.addLink(link.fromId, link.toId, link.data);
        });
        graph.endUpdate();
    }

    function graphFromJson<X, Y>(
        jsonData: JsonData<X, Y>,
        transformers?: JsonTransformers<NodeData, LinkData, X, Y>
    ): Graph<NodeData, LinkData> | undefined {
        if (
            (typeof jsonData === 'string' && jsonData.length) ||
            (typeof jsonData !== 'string' && jsonData.nodes.length && jsonData.links.length)
        ) {
            let graph: Graph<NodeData, LinkData>;
            if (!transformers) {
                graph = fromJson(jsonData);
                graph.getNode(1)?.data;
            } else {
                graph = fromJson(jsonData, transformers.nodeTransformer, function linkTransform(link: Y): JsonLink<LinkData> {
                    const tLink = transformers.linkTransformer(link);
                    return {
                        ...tLink,
                        data: {
                            ...tLink.data,
                            uuid: hash(link),
                            groupId: hash({ [tLink.fromId]: '', [tLink.toId]: '' }),
                        },
                    };
                });
            }

            return graph;
        }
        return;
    }

    function createPhysicsSettings(nodeSize = 40): Omit<PhysicsSettings, 'adaptiveTimeStepWeight' | 'dimensions' | 'debug'> {
        return {
            springLength: nodeSize * 4,
            springCoefficient: 0.004 / nodeSize,
            dragCoefficient: 0.01,
            gravity: -0.278 * Math.pow(nodeSize, 1 + nodeSize * 0.0034),
            theta: 1,
            timeStep: 8,
        };
    }
}
