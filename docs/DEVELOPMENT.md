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

`web/index.template.html` contains the original paper UI and interaction code. `web/storage.js`, `web/transcript.js`, `web/i18n.js` and `web/exports.js` are inlined by the build into the standalone root `index.html`. GitHub Pages serves that generated file from `main` as before.

The public build is a single standalone HTML file plus optional PWA assets. `npm run build:icons` regenerates the web icons and README logo from `icons/mark.svg`, using the same borderless dialogue-bubble shapes and paper/gray/green palette as the interface.

## Storage

Pages migrates the previous `chat_messages` localStorage array into IndexedDB atomically and only removes the source after a successful transaction. Subsequent appends write one message. Standalone browsers that deny IndexedDB retain the localStorage fallback. A storage failure keeps the current text in memory, gives an actionable error and lets the next save recover the full state. Damaged history is not overwritten.

## Rendering and motion

The transcript uses variable-height virtual rows with overscan, measured height caching, binary-search lookup and explicit scroll anchoring. Native browser anchoring is disabled to avoid double adjustment when spacers change. Every message remains in the history and is reachable by continuous scrolling; exporting reads the full history, not the rendered DOM.

Text is inserted in full as one text node. Sending applies a 240 ms upward transform to the new bubble and to visible earlier bubbles displaced by it, with at most 24 moving rows. Scrolling cancels message movement; hidden views and reduced-motion changes finish it immediately. Historical rows do not replay entry animation.

The conversation keeps native wheel, touch and keyboard scrolling with a custom translucent overlay handle. It is hidden when there is no overflow, appears immediately during scrolling or interaction near the right edge, waits 800 ms after activity, then fades over 600 ms. Dragging, track clicks, Home/End and arrow/page keys are supported. ResizeObserver and one scheduled animation frame update its geometry; there is no polling or permanent decorative animation. Native scrollbar visibility settings cannot reveal a second track. The composer auto-grows to a viewport-limited height and allows caret scrolling without showing a scrollbar; width changes remeasure wrapped drafts.

Aging is applied to a shared content wrapper so the body and timestamp fade and blur together, while deletion controls stay clear. Language follows the browser; Chinese and English documentation screenshots are captured from isolated example histories with `npm run screenshots`.

These choices follow [Apple's motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion): purposeful, brief feedback, input available during animation, and accessibility preferences. Smoothness and power are tested separately from correctness; there is no measured battery-life claim.

The composer keeps its send button inside a single rounded input surface. A 44 px target stays in the lower-right corner as the draft grows, with reserved text padding and no visible input scrollbar. Run `npm run test:composer` for narrow layouts, both themes, caret editing and complete sends.
