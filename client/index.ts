import alt from 'alt-client';
import native from 'natives';

let interval: number;
let timeInTheFuture: number;

alt.onServer('update:death:time:left', updateTimeLeft);

function updateTimeLeft(ms: number) {
    timeInTheFuture = Date.now() + ms;
}

alt.onServer('death:timer', () => {
    if (!interval) {
        interval = alt.setInterval(tick, 0);
    }
})

function tick() {
    const timeLeft = timeInTheFuture - Date.now();
        if (timeLeft > 0) {
            drawText2D(
                `${(timeLeft / 1000).toFixed(0)}s Until respawn`,
                { x: 0.5, y: 0.2 },
                0.75,
                new alt.RGBA(255, 255, 255, 255),
            );
        } else {
            alt.clearInterval(interval);
            interval = undefined;
        }
}

/**
 * Draw text on your screen in a 2D position with an every tick.
 * @param  {string} text
 * @param  {alt.Vector2} pos
 * @param  {number} scale
 * @param  {alt.RGBA} color
 * @param  {number | null} alignment 0 Center, 1 Left, 2 Right
 */
export function drawText2D(
    text: string,
    pos: alt.IVector2,
    scale: number,
    color: alt.RGBA,
    alignment: number = 0,
    padding: number = 0,
) {
    if (scale > 2) {
        scale = 2;
    }

    native.clearDrawOrigin();
    native.beginTextCommandDisplayText('STRING');
    native.addTextComponentSubstringPlayerName(text);
    native.setTextFont(4);
    native.setTextScale(1, scale);
    native.setTextColour(color.r, color.g, color.b, color.a);
    native.setTextOutline();
    native.setTextDropShadow();
    if (alignment !== null) {
        native.setTextWrap(padding, 1 - padding);
        native.setTextJustification(alignment);
    }

    native.endTextCommandDisplayText(pos.x, pos.y, 0);
}