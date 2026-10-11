# Develop and build

Node.js 24 is used for the web build and tests.

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:motion
npm run test:browser
```

`web/index.template.html` contains the original paper UI and interaction code. `web/storage.js`, `web/transcript.js` and `web/exports.js` are inlined by the build into the standalone root `index.html`. GitHub Pages serves that generated file from `main` as before.

The public build is a single standalone HTML file plus optional PWA assets. `npm run build:icons` regenerates the web icons and README logo from `icons/mark.svg`, using the same borderless dialogue-bubble shapes and paper/gray/green palette as the interface.

## Storage

Pages migrates the previous `chat_messages` localStorage array into IndexedDB atomically and only removes the source after a successful transaction. Subsequent appends write one message. Standalone browsers that deny IndexedDB retain the localStorage fallback. A storage failure keeps the current text in memory, gives an actionable error and lets the next save recover the full state. Damaged history is not overwritten.

## Rendering and motion

The transcript uses variable-height virtual rows with overscan, measured height caching, binary-search lookup and explicit scroll anchoring. Native browser anchoring is disabled to avoid double adjustment when spacers change. Every message remains in the history and is reachable by continuous scrolling; exporting reads the full history, not the rendered DOM.

Only a newly sent short message gets a character-opacity reveal. Grapheme segmentation preserves composed emoji and text, spans are capped at 160. A single character fades in over 600 ms; phrases have at least a 700 ms span between the first and last character starts, with a 420 ms fade for each. Longer passages use approximately 65 ms between starts, capped at a six-second stagger, and collapse back to one text node within 6.52 seconds. Long messages render immediately. Menus and dialogs use short opacity / transform transitions. The reduced-motion preference removes reveals and transitions; hidden documents stop maintenance timers and finish active text reveals. Idle conversations have no continuous decorative animation. Aging is applied to a shared content wrapper so the body and timestamp fade and blur together, while deletion controls stay clear. There is no added fading toggle or backup import item.

These choices follow [Apple's motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion): purposeful, brief feedback, input available during animation, and accessibility preferences. Smoothness and power are tested separately from correctness; there is no measured battery-life claim.

