// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const memory = new WebAssembly.Memory({
    initial: 512,
    maximum: 512,
    shared: true
});
const workers = Array.from({
    length: 16
}, (_, id)=>{
    const worker = new Worker("./worker.js");
    send(worker, {
        type: "init",
        ctx: {
            memory,
            id,
            count: 16
        }
    });
    return worker;
});
const params = {
    width: canvas.width,
    height: canvas.height,
    center_x: -0.101096363845,
    center_y: 0.95628651,
    scale: .003125
};
let lastTick = Date.now();
tick();
async function tick() {
    console.time("tick");
    params.scale /= 1.05 ** ((Date.now() - lastTick) / 100);
    lastTick = Date.now();
    await Promise.all(workers.map(async (worker)=>{
        send(worker, {
            type: "render",
            params
        });
        await done(worker);
    }));
    send(workers[0], {
        type: "draw",
        params
    });
    await done(workers[0]);
    let x = canvas.width * canvas.height * 4;
    const imageData = new ImageData(new Uint8ClampedArray(memory.buffer, x * 2, x).slice(), canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
    console.timeEnd("tick");
    requestAnimationFrame(tick);
}
function send(worker, msg) {
    worker.postMessage(msg);
}
function done(worker) {
    return new Promise((resolve)=>worker.addEventListener("message", function handler(event) {
            const msg = event.data;
            if (msg.type === "done") {
                resolve();
                worker.removeEventListener("message", handler);
            }
        }));
}
