/// <reference lib="webworker"/>

import { deferred } from "https://deno.land/std@0.167.0/async/deferred.ts"
import { HostMessage, WasmExports, WasmImports, WorkerCtx, WorkerMessage } from "./shared.ts"

const ctxPromise = deferred<WorkerCtx>()
const wasmPromise = init()

async function init() {
  const ctx = await ctxPromise
  const wasmImports: WasmImports = {
    ctx: {
      memory: ctx.memory,
      id: new WebAssembly.Global({ value: "i32" }, ctx.id),
      count: new WebAssembly.Global({ value: "i32" }, ctx.count),
    },
    log: {
      u32: console.log,
      f64: console.log,
    },
  }
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch("./mandelb.wasm"),
    wasmImports,
  )
  return instance.exports as never as WasmExports
}

self.addEventListener("message", async (event) => {
  const msg = event.data as HostMessage
  if (msg.type === "init") {
    ctxPromise.resolve(msg.ctx)
    return
  }
  const wasm = await wasmPromise
  if (msg.type === "calc") {
    wasm.calc(...msg.params)
    send({ type: "done" })
  }
  if (msg.type === "draw") {
    wasm.draw(...msg.params)
    send({ type: "done" })
  }
})

function send(msg: WorkerMessage) {
  self.postMessage(msg)
}
