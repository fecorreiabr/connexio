import { Application } from '@pixi/app';
import { Container } from '@pixi/display';
import { Graphics } from '@pixi/graphics';
import { InteractionEvent } from '@pixi/interaction';
import { Text } from '@pixi/text';
import { Texture } from '@pixi/core';
import { Polygon } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import type { IPointData } from '@pixi/math';

// Renderer plugins
import { Renderer } from '@pixi/core';
import { BatchRenderer } from '@pixi/core';
Renderer.registerPlugin('batch', BatchRenderer);
import { InteractionManager, InteractionData } from '@pixi/interaction';
Renderer.registerPlugin('interaction', InteractionManager);

// Application plugins
import { TickerPlugin } from '@pixi/ticker';
Application.registerPlugin(TickerPlugin);

Application.prototype.getGraphCoordinates = (function () {
    const ctx = {
        global: { x: 0, y: 0 }, // store it inside closure to avoid GC pressure
    };

    return function (this: Application, x: number, y: number) {
        ctx.global.x = x;
        ctx.global.y = y;
        return InteractionData.prototype.getLocalPosition.call(ctx, this.stage);
    };
})();

declare module '@pixi/app' {
    interface Application {
        getGraphCoordinates(x: number, y: number): IPointData;
    }
}

type StageEventDetail = {
    x: number;
    y: number;
    scale: number;
};

export { Application, Container, Graphics, InteractionEvent, Text, Texture, Polygon, Sprite, StageEventDetail };
