# Validation · 2026-10-11

Local hardware: Apple M4 Pro, macOS 15.8. Chrome runs headlessly at 390 × 844 for the history benchmark. Both versions use the same message contents, timestamps, viewport, browser and first-frame measurement. Baseline HTML is pinned to GitHub commit `6a4ae6e9a7980d7d83af4e41ee6b75671f341ee2`.

| History | Before: open | After: open | Before: live message nodes | After: live message nodes | Before: send median | After: send median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 3,000 messages | 778 ms | 178 ms | 3,003 | 13 | 22.3 ms | 18.4 ms |
| 10,000 messages | 2,310 ms | 316 ms | 10,003 | 14 | 79.2 ms | 6.2 ms |

Opening measurements include the new version's initial migration. Send timing measures click-to-next-animation-frame; it is not disk durability latency. The data is one local run with three sends per condition, rather than a cross-device performance guarantee. In the 90-frame scripted scroll probe, both versions recorded zero intervals above 34 ms; after-change p95 intervals were 16.7 ms in both sizes. This probe alone does not establish smoothness of every animation. Run `npm run benchmark` to reproduce; raw results go into `.test-results/performance.json`.

Browser integration covers 100, 3,000 and 10,000 messages: complete migration and reload, continuous top/middle/end history access, bounded row count, stable-ID deletion and undo, full-history download, composition input, multiline input, complete-text insertion and bounded whole-bubble movement, reduced motion, quota failure recovery, corrupt-history preservation, offline reopening, standalone HTML, font changes and fading. Notification rectangles remain below the header and above the composer in portrait and small landscape layouts. The normal conversation has no persistent save/status footer, connection messages, font-change messages or automatic installation banner. Saving starts with a readable copy; backup and model settings appear only when selected. A storage failure offers a working Save a copy action, opening a damaged history can be retried. Browser tests exercise these controls and verify continuation and training exports while offline, without network requests after initial page loading.

Export-format tests cover backup fidelity, provider-specific request fields, training target weights, incomplete turns, adjacent-role merging, Unicode text and the retained legacy formats.

API requests and fine-tuning files are validated against the linked schemas and local tests. No paid model calls or training jobs were performed. Battery consumption has not been measured; the implementation bounds rendering and animated rows, stops maintenance when hidden and avoids continuous idle animation.


The current UI regressions run with `npm run test:motion`. A 278 × 497 draft with seven lines previously had `overflow-y: auto`, a 118 px viewport and 188 px of content, exposing a native scrollbar. The revised composer uses hidden overflow, grows within the viewport and preserves all multiline input. Tests edit the end of long drafts at 278 × 497, 320 × 400, 320 × 568 and 844 × 390. Width changes remeasure wrapping on the next animation frame, avoiding mutation during ResizeObserver delivery.

New messages contain their entire Unicode and multiline text immediately in one text node. A whole-bubble transform lasts 240 ms; reduced motion skips it. Old messages do not replay entry motion during virtual scrolling. Timestamp and text still share their blur layer, while deletion controls remain clear.

The custom conversation scrollbar is invisible at rest and absent without overflow. Tests observe opacity 1 during scrolling, an intermediate opacity during the 600 ms fade, and 0 after it finishes. They exercise actual pointer dragging, Home/End keyboard navigation and ARIA position updates. The browser retains native wheel and touch scrolling. Chinese and English UI labels, purpose-based export actions, bubble colors and matching documentation screenshots are checked. No added fading or backup-import menu items are present.

Browser integration was rerun with 100, 3,000 and 10,000 records after this change, including save/reload, complete exports, deletion/undo, offline reopening and narrow/landscape layouts. The 10,000-record case kept 10 live message rows. Opening timings above describe the earlier baseline comparison, not a new cross-device benchmark.

The compact menu is tested in Chinese and English at 278, 320 and 640 px, including increased font size. It follows the longest label, keeps its right padding within 18 px and stays inside the viewport without clipped text. The export action has no ellipsis. The updated SVG regenerates every web icon and the README logo; the PWA cache version changes to refresh these assets without touching conversation storage.
