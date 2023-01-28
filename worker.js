// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

Date.now();
const memory = new WebAssembly.Memory({
    initial: 512,
    maximum: 512,
    shared: true
});
const wasmImports = {
    env: {
        memory
    },
    log: {
        u32: console.log,
        f64: console.log
    }
};
let wasm;
const initPromise = WebAssembly.instantiateStreaming(fetch("./mandelb.wasm"), wasmImports).then(({ instance  })=>{
    wasm = instance.exports;
    this;
});
self.addEventListener("message", async (event)=>{
    await initPromise;
    const msg = event.data;
    if (msg.type === "size") {
        wasm.width.value = msg.width;
        wasm.height.value = msg.height;
    }
    if (msg.type === "render") {
        wasm.draw();
        send({
            type: "render",
            buffer: memory.buffer
        });
    }
});
function send(msg) {
    self.postMessage(msg);
}
