import createGraph from './connexio';
import { Graph } from 'ngraph.graph';
import { EventedType } from 'ngraph.events';
import { NodeEventDetail } from './plugins/ngraph';

export default createGraph;

interface CustomEventMap {
    nodetap: CustomEvent<NodeEventDetail>;
    noderighttap: CustomEvent<NodeEventDetail>;
    mousewheel: CustomEvent<number>;
    DOMMouseScroll: CustomEvent<number>;
    MozMousePixelScroll: CustomEvent<number>;
}

declare global {
    interface Event {
        wheelDelta?: number;
        wheelDeltaX?: number;
        // detail?: number;
    }

    interface ElementEventMap extends CustomEventMap {}

    interface Window {
        // onmousewheel was removed in recent typescript, but it is necesssary for retro-compatibility
        onmousewheel: ((this: Window, ev: Event) => any) | null;
    }
}

declare module 'ngraph.forcelayout' {
    export default function createLayout<T extends Graph>(graph: T, physicsSettings?: Partial<PhysicsSettings>): Layout<T> & EventedType;
}
