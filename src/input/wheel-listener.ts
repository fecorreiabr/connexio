// Adapted from https://github.com/anvaka/ngraph/blob/120cd49b426150c4660aff9da4802000eca0d79b/examples/pixi.js/03%20-%20Zoom%20And%20Pan/lib/addWheelListener.js

/**
 * This module unifies handling of mouse whee event accross different browsers
 *
 * See https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel?redirectlocale=en-US&redirectslug=DOM%2FMozilla_event_reference%2Fwheel
 * for more details
 */
export default addWheelListener;

// detect available wheel event
const support =
    'onwheel' in document.createElement('div')
        ? 'wheel' // Modern browsers support "wheel"
        : window.onmousewheel !== undefined
        ? 'mousewheel' // Webkit and IE support at least "mousewheel"
        : 'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox

let passiveSupported = false;

try {
    const options = {
        get passive() {
            // This function will be called when the browser
            //   attempts to access the passive property.
            passiveSupported = true;
            return false;
        },
    };
    const testListener = () => null;

    window.addEventListener('test', testListener, options);
    window.removeEventListener('test', testListener);
} catch (err) {
    passiveSupported = false;
}

/**
 * Adds wheel listener to a HTML element
 * @param {HTMLElement} elem the HTML container
 * @param {Function} callback function to be called
 * @param {boolean} useCapture capture or not
 */
function addWheelListener(elem: Element, callback: (event: WheelEvent) => void, useCapture?: boolean): void {
    _addWheelListener(elem, support, callback, useCapture);

    // handle MozMousePixelScroll in older Firefox
    if (support == 'DOMMouseScroll') {
        _addWheelListener(elem, 'MozMousePixelScroll', callback, useCapture);
    }
}

function _addWheelListener(
    elem: Element,
    eventName: 'wheel' | 'mousewheel' | 'DOMMouseScroll' | 'MozMousePixelScroll',
    callback: (evt: WheelEvent) => void,
    useCapture?: boolean
): void {
    const cb = callback as EventListener;
    if (eventName === 'wheel') {
        elem.addEventListener(eventName, cb);
    } else {
        elem.addEventListener(
            eventName,
            e => {
                const originalEvent = e || window.event;

                // create a normalized event object
                const event = {
                    // keep a ref to the original event object
                    ...originalEvent,
                    target: originalEvent.target || originalEvent.srcElement,
                    type: 'wheel',
                    deltaMode: originalEvent.type == 'MozMousePixelScroll' ? 0 : 1,
                    deltaX: 0,
                    deltaY: 0,
                    delatZ: 0,
                    preventDefault: function () {
                        originalEvent.preventDefault ? originalEvent.preventDefault() : (originalEvent.returnValue = false);
                    },
                };

                // calculate deltaY (and deltaX) according to the event
                if (support == 'mousewheel') {
                    event.deltaY = (-1 / 40) * (originalEvent.wheelDelta || 0);
                    // Webkit also support wheelDeltaX
                    originalEvent.wheelDeltaX && (event.deltaX = (-1 / 40) * originalEvent.wheelDeltaX);
                } else {
                    originalEvent.detail && (event.deltaY = originalEvent.detail);
                }

                // it's time to fire the callback
                return cb(event);
            },
            passiveSupported ? { passive: false, capture: useCapture } : useCapture || false
        );
    }
}
