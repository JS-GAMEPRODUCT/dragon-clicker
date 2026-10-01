const fs = require("fs");
const p = "css/style.css";
let s = fs.readFileSync(p, "utf8");
let n = 0;

function replaceOnce(oldStr, newStr, label) {
  if (!s.includes(oldStr)) {
    console.log("missing", label);
    return;
  }
  s = s.replace(oldStr, newStr);
  n++;
  console.log("ok", label);
}

replaceOnce(
  `      /* Team module drawer (side panel → modal) — mobile only */
      .team-module {
        display: flex;
        flex-direction: column;
        inset: auto;
        left: 50%;
        right: auto;
        top: max(120px, calc(env(safe-area-inset-top, 0px) + 96px));
        bottom: auto;
        margin: 0;
        transform: translateX(-50%);
        width: 94vw;
        max-width: 94vw;
        height: auto;
        max-height: min(72vh, calc(100dvh - 120px - var(--nav-h, 64px) - env(safe-area-inset-bottom, 0px)));
        padding: 10px 10px 8px;
        overflow: hidden;
        z-index: 40;
        box-sizing: border-box;
      }
      .team-module.open {
        display: flex;
      }`,
  `      /* Team module drawer — mobile only (final #team-module block overrides) */
      .team-module {
        position: fixed;
        display: none;
        flex-direction: column;
        inset: auto;
        left: 50%;
        right: auto;
        top: 50%;
        bottom: auto;
        margin: 0;
        transform: translate(-50%, -50%);
        animation: none;
        width: 90vw;
        max-width: 420px;
        height: auto;
        max-height: 72vh;
        padding: 12px 12px 10px;
        overflow: hidden;
        z-index: 80;
        box-sizing: border-box;
      }
      .team-module.open {
        display: flex;
      }`,
  "early-768"
);

replaceOnce(
  `  .team-module,
  .team-module.open {
    inset: auto;
    left: 50%;
    right: auto;
    top: max(120px, calc(env(safe-area-inset-top, 0px) + 96px));
    bottom: auto;
    margin: 0;
    transform: translateX(-50%);
    width: 94vw;
    max-width: 94vw;
    height: auto;
    max-height: min(72vh, calc(100dvh - 120px - var(--nav-h, 64px) - env(safe-area-inset-bottom, 0px)));
    overflow: hidden;
    z-index: 40;
    padding: 10px 10px 8px;
    box-sizing: border-box;
  }`,
  `  .team-module,
  .team-module.open {
    position: fixed;
    inset: auto;
    left: 50%;
    right: auto;
    top: 50%;
    bottom: auto;
    margin: 0;
    transform: translate(-50%, -50%);
    animation: none;
    width: 90vw;
    max-width: 420px;
    height: auto;
    max-height: 72vh;
    overflow: hidden;
    z-index: 80;
    padding: 12px 12px 10px;
    box-sizing: border-box;
  }`,
  "late-768"
);

replaceOnce(
  `  .team-module,
  .team-module.open {
    top: max(110px, calc(env(safe-area-inset-top, 0px) + 88px));
    max-height: min(70vh, calc(100dvh - 110px - var(--nav-h, 56px) - env(safe-area-inset-bottom, 0px)));
    padding: 8px 8px 6px;
  }`,
  `  .team-module,
  .team-module.open {
    position: fixed;
    left: 50%;
    right: auto;
    top: 50%;
    transform: translate(-50%, -50%);
    animation: none;
    width: 92vw;
    max-width: 420px;
    max-height: 70vh;
    padding: 10px 10px 8px;
  }`,
  "480"
);

fs.writeFileSync(p, s);
console.log("patched", n);