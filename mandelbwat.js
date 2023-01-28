// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const memory = new WebAssembly.Memory({
    initial: 512
});
const width = new WebAssembly.Global({
    value: "i32",
    mutable: true
});
const height = new WebAssembly.Global({
    value: "i32",
    mutable: true
});
const { instance: wasm  } = await WebAssembly.instantiateStreaming(fetch("./mandelb.wasm"), {
    canvas: {
        memory,
        width,
        height
    },
    log: {
        u32: console.log,
        f64: console.log
    }
});
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
width.value = canvas.width;
height.value = canvas.height;
console.log(memory.buffer);
let imageData = new ImageData(new Uint8ClampedArray(memory.buffer, 0, width.value * height.value * 4), width.value, height.value);
console.time("tick");
animate();
function animate() {
    console.log(wasm.exports.scale);
    console.timeEnd("tick");
    console.time("tick");
    wasm.exports.draw();
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(animate);
}
console.log(new Uint8Array(memory.buffer));
