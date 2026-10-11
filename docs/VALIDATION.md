# Validation · 2026-10-11

Local hardware: Apple M4 Pro, macOS 15.8. Chrome runs headlessly at 390 × 844 for the history benchmark. Both versions use the same message contents, timestamps, viewport, browser and first-frame measurement. Baseline HTML is pinned to GitHub commit `6a4ae6e9a7980d7d83af4e41ee6b75671f341ee2`.

| History | Before: open | After: open | Before: live message nodes | After: live message nodes | Before: send median | After: send median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 3,000 messages | 778 ms | 178 ms | 3,003 | 13 | 22.3 ms | 18.4 ms |
| 10,000 messages | 2,310 ms | 316 ms | 10,003 | 14 | 79.2 ms | 6.2 ms |

Opening measurements include the new version's initial migration. Send timing measures click-to-next-animation-frame; it is not disk durability latency. The data is one local run with three sends per condition, rather than a cross-device performance guarantee. In the 90-frame scripted scroll probe, both versions recorded zero intervals above 34 ms; after-change p95 intervals were 16.7 ms in both sizes. This probe alone does not establish smoothness of every animation. Run `npm run benchmark` to reproduce; raw results go into `.test-results/performance.json`.

Browser integration covers 100, 3,000 and 10,000 messages: complete migration and reload, continuous top/middle/end history access, bounded row count, stable-ID deletion and undo, full-history download, composition input, multiline input, bounded character animation and cleanup, reduced motion, quota failure recovery, corrupt-history preservation, offline reopening, standalone HTML, font changes and fading. Notification rectangles remain below the header and above the composer in portrait and small landscape layouts. The normal conversation has no persistent save/status footer, connection messages, font-change messages or automatic installation banner. Saving starts with a readable copy; backup and model settings appear only when selected. A storage failure offers a working Save a copy action, opening a damaged history can be retried. Browser tests exercise these controls and verify continuation and training exports while offline, without network requests after initial page loading.

Export-format tests cover backup fidelity, provider-specific request fields, training target weights, incomplete turns, adjacent-role merging, Unicode text and the retained legacy formats.

API requests and fine-tuning files are validated against the linked schemas and local tests. No paid model calls or training jobs were performed. Battery consumption has not been measured; the implementation bounds rendering and character spans, stops maintenance when hidden and avoids continuous idle animation.


The timestamp regression first failed with a clear timestamp beside blurred text; after the fix the inherited blur is identical for both, with the delete control unaffected. A three-character Chinese phrase previously reached 0.96 opacity on the last character after 210 ms; it now still has its last character at zero opacity then, completes within the bounded reveal time and retains its exact text. These focused regressions run with `npm run test:motion`. Browser integration also checks compact 320 × 400 / 320 × 568, landscape, tablet and desktop dimensions, complete reveal cleanup, reduced motion, and the removal of the two unrequested menu items.

