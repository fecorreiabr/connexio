import createGraph from './connexio';

export default createGraph;

interface CustomEventMap {
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

    interface Element {
        //adds definition to Document, but you can do the same with HTMLElement
        addEventListener<K extends keyof CustomEventMap>(
            type: K,
            listener: (this: Document, ev: CustomEventMap[K]) => unknown,
            options?: boolean | AddEventListenerOptions
        ): void;
    }

    interface Window {
        // onmousewheel was removed in recent typescript, but it is necesssary for retro-compatibility
        onmousewheel: ((this: Window, ev: Event) => any) | null;
    }
}
