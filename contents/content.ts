import type { PlasmoCSConfig } from "plasmo"
 
export const config: PlasmoCSConfig = {
  matches: ["https://rvsq.gouv.qc.ca/*"],
  all_frames: true,
  world: "MAIN",
}
window.addEventListener("load", () => {
    document.body.style.background = "blue"
  })