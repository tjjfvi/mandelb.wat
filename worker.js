// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function deferred() {
    let methods;
    let state = "pending";
    const promise = new Promise((resolve, reject)=>{
        methods = {
            async resolve (value) {
                await value;
                state = "fulfilled";
                resolve(value);
            },
            reject (reason) {
                state = "rejected";
                reject(reason);
            }
        };
    });
    Object.defineProperty(promise, "state", {
        get: ()=>state
    });
    return Object.assign(promise, methods);
}
const ctxPromise = deferred();
const wasmPromise = init();
async function init() {
    const ctx = await ctxPromise;
    const wasmImports = {
        ctx: {
            memory: ctx.memory,
            id: new WebAssembly.Global({
                value: "i32"
            }, ctx.id),
            count: new WebAssembly.Global({
                value: "i32"
            }, ctx.count)
        },
        log: {
            u32: console.log,
            f64: console.log
        }
    };
    const { instance  } = await WebAssembly.instantiateStreaming(fetch("./mandelb.wasm"), wasmImports);
    return instance.exports;
}
self.addEventListener("message", async (event)=>{
    const msg = event.data;
    if (msg.type === "init") {
        ctxPromise.resolve(msg.ctx);
        return;
    }
    const wasm = await wasmPromise;
    if (msg.type === "render") {
        const { width , height , center_x , center_y , scale  } = msg.params;
        wasm.calc(width, height, center_x, center_y, scale);
        send({
            type: "done"
        });
    }
    if (msg.type === "draw") {
        const { width: width1 , height: height1  } = msg.params;
        wasm.draw(width1, height1);
        send({
            type: "done"
        });
    }
});
function send(msg) {
    self.postMessage(msg);
}
