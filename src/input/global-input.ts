import { type PixiGraph } from '@/components/pixi-graph';
import { InteractionEvent } from '@/plugins/pixijs';
import addWheelListener from './wheel-listener';

export default globalInput;

/**
 * Function to add drag and drop and zoom funcionality to a Pixi Application
 * @param {PixiGraph} pixi The Pixi Application
 */
function globalInput(pixi: PixiGraph): void {
    addWheelListener(
        pixi.view,
        function (e) {
            e.preventDefault();
            // e.stopPropagation();
            zoom(e.offsetX, e.offsetY, e.deltaY < 0);
            dispatchEvent('graphzoom', e);
        },
        true
    );

    addDragNDrop();

    function zoom(x: number, y: number, isZoomIn: boolean) {
        const direction = isZoomIn ? 1 : -1;
        const factor = 1 + direction * 0.1;
        pixi.stage.scale.x *= factor;
        pixi.stage.scale.y *= factor;

        // Technically code below is not required, but helps to zoom on mouse
        // cursor, instead center of graphGraphics coordinates
        const beforeTransform = pixi.getGraphCoordinates(x, y);
        pixi.render();
        const afterTransform = pixi.getGraphCoordinates(x, y);

        pixi.stage.position.x += (afterTransform.x - beforeTransform.x) * pixi.stage.scale.x;
        pixi.stage.position.y += (afterTransform.y - beforeTransform.y) * pixi.stage.scale.y;
    }

    function addDragNDrop() {
        const stage = pixi.stage;
        stage.interactive = true;

        let isDragging = false,
            dragStarted = false,
            prevX = 0,
            prevY = 0;

        pixi.renderer.plugins.interaction.on('pointerdown', (event: InteractionEvent) => {
            if (!event.target) {
                const pos = event.data.global;
                prevX = pos.x;
                prevY = pos.y;
                dragStarted = true;
            }
        });

        pixi.renderer.plugins.interaction.on('pointermove', (event: InteractionEvent) => {
            if (!dragStarted) {
                return;
            }
            isDragging = true;
            const pos = event.data.global;
            const dx = pos.x - prevX;
            const dy = pos.y - prevY;

            stage.position.x += dx;
            stage.position.y += dy;
            prevX = pos.x;
            prevY = pos.y;
            dispatchEvent('graphdrag', event.data.originalEvent as MouseEvent);
        });

        pixi.renderer.plugins.interaction.on(['pointerup'], (event: InteractionEvent) => {
            if (!event.target && !isDragging) {
                switch (event.data.button) {
                    case 0:
                        dispatchEvent('bgtap', event.data.originalEvent as MouseEvent);
                        break;

                    case 2:
                        dispatchEvent('bgrighttap', event.data.originalEvent as MouseEvent);
                        break;
                
                    default:
                        break;
                }
            }
            isDragging = false;
            dragStarted = false;
        });

        pixi.renderer.plugins.interaction.on(['pointerupoutside'], (_: InteractionEvent) => {
            isDragging = false;
            dragStarted = false;
        });
    }

    function dispatchEvent(type: 'bgtap' | 'bgrighttap' | 'graphdrag' | 'graphzoom', evt: MouseEvent): void {
        evt.preventDefault();
        pixi.dispatchEvent(type, {
            bubbles: true,
            detail: {
                x: evt.clientX,
                y: evt.clientY,
                scale: pixi.stage.scale.x
            }
        })
    }
}
