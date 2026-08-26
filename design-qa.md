# Design QA

source visual truth: `/tmp/runway-portfolio-before.png`
implementation screenshot: `/tmp/runway-portfolio-dark-desktop.png`
comparison image: `/tmp/runway-portfolio-dark-comparison.png`
mobile implementation screenshot: `/tmp/runway-portfolio-dark-mobile.png`
viewport: 1578 x 1242 desktop at deviceScaleFactor 1; secondary mobile check at 390 x 844
source pixels: 1578 x 1242
implementation pixels: 1578 x 1242
normalization: identical desktop CSS viewport, pixel dimensions, density, route, and default state; no resampling
state: default page, works gallery, and first video modal

## Comparison Evidence

- Full view: implementation follows the reference's narrow centered container, compact navigation, large opening identity block, three-column metric band, repeated editorial chapters, timeline, and black footer.
- Focused regions: the opening portrait/text split, metric rules, chapter intro-to-media relationship, and footer were checked against the source image. The implementation intentionally uses the user's portrait and local video posters in place of the source site's unrelated imagery.

## Required Fidelity Surfaces

- Typography: restrained system sans, regular display weights, small gray metadata labels, and compact Chinese copy match the reference's editorial hierarchy.
- Spacing/layout: centered 980px content rail, generous vertical chapter gaps, hairline dividers, left narrative column and right media column are stable at desktop and mobile.
- Colors/tokens: `#080808` page, `#101010` surface, `#171717` hover surface, `#f2f2f2` primary type, `#989898` secondary type, and 14%-white rules; no accent hue was introduced.
- Image fidelity: supplied portrait is used locally; 41 local MP4 poster frames remain the source of truth for the works. Representative posters are eager-loaded, gallery posters remain lazy-loaded.
- Copy/content: Chinese navigation and recruitment-oriented copy reflect the confirmed target audience; no fabricated personal metrics were added beyond the supplied 41 works and 1亿元+ project experience.

## Interaction Checks

- `查看作品`, `经历`, `联系` anchors work.
- Representative poster images all report complete natural dimensions.
- Gallery opens with the expected eight AI 漫剧 items.
- Video modal loads an H.264 MP4 with native controls and `readyState: 4`.
- Right-arrow changes the modal counter from `01 / 08` to `02 / 08`.
- `Escape` closes the modal.
- Desktop has no horizontal overflow; mobile layout stays within 390px.
- Browser console errors: none; failed HTTP responses: none.

## Findings

No actionable P0, P1, or P2 findings remain. The reference is a static editorial website capture while the implementation adds real video galleries and playback, which is an intentional content-specific deviation.

## Comparison History

- Pass 1: initial editorial redesign had representative posters marked lazy, which made lower sections appear black in full-page capture before they entered the viewport. Fix: representative posters are now eager-loaded while gallery thumbnails remain lazy. Post-fix evidence: all representative posters completed successfully in browser QA.
- Pass 2: category rows initially inherited the chapter's left narrative column, pushing the media/text row too far right. Fix: chapter introductions now sit above a full-width row, with the representative video at left and copy at right. Post-fix evidence: desktop geometry measured video at x=230 and copy at x=872; expanded media uses the full row width.
- Pass 3: residual hairline dividers made the content denser than the supplied reference. Fix: removed chapter, stats, hero, and experience list divider lines; structure now relies on whitespace and the expanded media block.
- Pass 4: user requested white expanded galleries with no overlay text and source-ratio media. Fix: all categories default open, landscape and portrait videos are split into separate three-column groups, tile text/overlays are hidden, and image height follows each poster's natural aspect ratio. Post-fix evidence: gallery background is `rgb(255, 255, 255)`, tile overlays are `display: none`, and mobile width remains 390px without overflow.
- Pass 5: poster and representative-card fidelity needed to follow the original video dimensions and first visible frame. Fix: regenerated all 41 posters from the first frame, skipping only leading black frames, and removed the representative-card fixed aspect ratio. Post-fix evidence: portrait cards render at `600 x 1067` or `600 x 800`, landscape cards render at `600 x 338`; all 41 expanded posters load and playback remains ready.
- Pass 6: user clarified that black frames must not be skipped and portrait galleries should be narrower. Fix: regenerated all 41 posters at exact timestamp `0`, set desktop landscape galleries to three columns and portrait galleries to six columns, with mobile fallbacks of two and three columns. Post-fix evidence: 41 posters load, landscape columns are 3, portrait columns are 6, mobile has no horizontal overflow, and console errors are absent.
- Pass 7: user requested project-specific editorial sizing and grouping. Fix: AI 漫剧 representative cover is 50% wide (one quarter area), 《我们的故宫》 representative cover is 70.71% wide (half area), both preserve native ratios; AI portrait tiles use two columns; palace portrait tiles use four columns; single-video Tibet has no expanded gallery; the two新华社 other videos are separate cards; Xiaomi challenge videos are ordered first. Production build passes.
- Pass 8: user requested all representative covers to be half-area, the palace representative to be landscape, and representative videos to disappear from their expanded grids. Fix: all desktop representative covers use 70.71% width with native aspect ratios; palace pins `palace-02` as its landscape representative; galleries render only `videos.slice(1)` while modal indices remain mapped to the full collection. Production build passes.
- Pass 9: user requested AI portrait thumbnails to visually match the height of landscape thumbnails and the Xiaomi representative to be the screen-drop episode. Fix: AI portrait gallery uses seven narrow desktop columns so native portrait frames approach the landscape tile height; mobile remains two columns; Xiaomi pins `xiaomi-06` as representative and moves the other challenge videos ahead of the remaining collection. Production build passes.
- Pass 10: user requested a desktop-only pass against `DESIGN-runwayml.md` focused on browsing efficiency. Fix: desktop now uses a wider 1120px reading rail, 64px navigation rhythm, slate secondary text, hairline section dividers, larger editorial chapter spacing, clearer cover-to-copy hierarchy, pill actions, rounded media thumbnails, and a structured experience/footer grid. Mobile rules remain unchanged. Production build passes.
- Pass 11: user requested a Runway Ideation & Concepting use-case page rhythm. Fix: added four anchor category tabs, converted expanded video tiles to media-plus-caption cards, set desktop landscape galleries to two columns with narrow portrait columns, inserted black chapter transition bars, and preserved portrait hero, local assets, modal controls, and representative-video exclusion. Production build and local HTTP checks pass.
- Pass 12: user clarified that the layout still did not match the reference and requested a pure video grid. Fix: removed representative cover cards and chapter black bars, restored every category video to the complete grid, placed project metadata on the left with the media wall on the right, and retained native video ratios and modal playback. Production build passes and the manifest contains all 41 videos.
- Pass 13: user annotated the remaining text and grid treatment. Fix: removed chapter/project descriptions and external links from the visible works area while keeping top category tabs; reordered Xiaomi videos to `05, 06, 07, 01, 02, 03, 04`; changed footer copy to capability-focused language; set AI to 4 columns x 2 rows and palace to four columns on desktop. Production build passes.
- Pass 14: user requested five top-level categories and a two-level Xinhua grouping. Fix: labels now read ReelShort 短剧, 纪录片学院奖片花, 新华社, 央视频, 小米宣传片; Xinhua contains 长纪录片 and 短视频 subgroups; 广西坚果 is separated into 央视频; all desktop landscape groups use two columns with consistent media sizing and final category-specific grid overrides. Production build passes.
- Pass 15: implementation verification for the Runway reference layout plan. Confirmed the portrait hero and statistics remain untouched, five category anchors resolve to their sections, Xinhua retains its two subgroups, landscape galleries use two columns, portrait galleries preserve native ratios, and media cards retain 8px rounded corners. Production build and local resource checks pass.
- Pass 16: user requested reference-scale media modules and caption hierarchy. Fix: desktop category sections now use a 1/4 title rail and 3/4 media rail; landscape cards use equal 16:9 two-column modules; portrait cards use four columns without ratio changes; captions place small metadata above the larger title. Production build passes.
- Pass 17: user requested all video modules to be enlarged while preserving aspect ratios and column counts. Fix: desktop works rail expands to near full width, the category title rail is fixed at 180px, horizontal galleries remain two columns, portrait galleries remain four columns, and captions scale with the larger media modules. No horizontal overflow is introduced by the layout rules. Production build passes.

## Follow-up Polish

- P3: some source videos may intentionally begin with a title card or dark frame; posters now use the exact first frame as requested.

historical final result: passed

## Pass 29: Hero reference layout
- Desktop hero now uses the reference composition: oversized two-line identity title at lower left, compact rounded portrait at upper right, and concise intro/CTA at lower right.
- Kept the existing portrait asset and personal content; works, video data, and player behavior are unchanged.
- Verified at 1440px desktop viewport: no overlap between title, portrait, copy, or CTA; production build passed.

## Pass 30: Hero fidelity refinement
- Removed the extra eyebrow line so the first viewport matches the reference's clean white field.
- Enlarged and lowered the two-line title, enlarged the portrait card, and aligned the right-side intro/CTA to the title baseline.
- Verified the final desktop render at 1440px and confirmed `npm run build` passes.

- Pass 18: user confirmed the final geometry. Desktop category sections use an exact 1/4 title rail and 3/4 media wall; Xinhua's 长纪录片 and 短视频 subgroups repeat the same nested relationship. Landscape media remains two equal 16:9 columns, portrait media remains four columns with native ratios, and mobile falls back to stacked category layout. Production build verified after the CSS-only adjustment.
- Pass 19: Xinhua videos are now classified by actual duration: videos longer than 20 minutes appear under 长纪录片, while videos at or below 20 minutes appear under 短视频. Project groups are filtered per video so mixed-length projects are split correctly. Production build passes.
- Pass 20: restored the two separate Xinhua short-video mappings (`xinhua-more` and `xinhua-animation`) after the duration split, so 九三阅兵 and 采访易中天 / 《三国的星空》 remain visible under 短视频.
- Pass 21: removed the nested project rail that was shrinking each gallery a second time. Academy, Xinhua subgroups, and Xiaomi media walls now fill their assigned 3/4 rail; Xinhua subgroup divider lines are removed while landscape two-column and portrait four-column rules remain intact.
- Pass 22: matched the reference composition more directly by merging each category into one continuous media wall, merging each Xinhua subgroup into one wall, retaining small metadata above larger titles, and moving play affordances to hover/focus so the default state reads as a clean image grid. Desktop render verified at 1590px with no horizontal overflow.
- Pass 23: moved 新华社的“长纪录片”和“短视频” labels into the outer left title rail beneath 新华社, aligned each label with its corresponding wall, and removed the nested subgroup rail.
- Pass 24: portrait video cards now preserve their source aspect ratios while keeping the existing four-column widths. Browser measurement confirms the AI cards render at approximately 251 x 446 for 960 x 1706 source posters; landscape 16:9 rules are unchanged.
- Pass 25: the video modal now receives the active orientation class. Desktop measurement confirms a portrait preview stage at 558 x 992 (9:16) inside a matching narrow shell; landscape previews retain a 16:9 shell.
- Pass 26: added concise display titles for all local videos. Gallery captions, accessible labels, and modal headers now use the same short names while source files and playback data remain unchanged.
- Pass 27: redesigned the video preview as a reference-style split modal: video on the left, project information and close action on the right, with the existing native controls and previous/next footer retained. Browser measurements confirm landscape stage 785 x 442 (16:9) and portrait stage 559 x 993 (9:16).
- Pass 28: removed the annotated small kicker labels from the hero, stats, works, category, and experience sections, and removed the overlapping hero location/year meta. Main headings and media remain unchanged.

## Pass 31: Cinematic dark theme

### Full-view comparison evidence

- The combined before/after image at `/tmp/runway-portfolio-dark-comparison.png` confirms that navigation, hero geometry, portrait crop, copy wrapping, metric columns, and first-viewport spacing are unchanged while every white page surface is replaced by the intended neutral black system.
- The works capture confirms that portrait and landscape media retain their original color, crop, ratio, and grid positions against the dark canvas.

### Focused-region comparison evidence

- Hero: the initial dark render exposed a P1 contrast regression from legacy desktop selectors (`#111216` title and `#17191e` side copy). The final theme now resolves the title to `rgb(242, 242, 242)` and supporting copy to `#989898`.
- Works grid: category headings and captions resolve to `rgb(242, 242, 242)`; media cards use a subtle 10%-white edge without changing image dimensions.
- Modal: the first ReelShort item opens in a split dark shell with the existing native video controls, project metadata, and close action.
- Mobile: the 390 x 844 checks cover the top composition and ReelShort grid; `innerWidth` is 390 and document `scrollWidth` is 375, so no horizontal overflow is introduced.

### Current findings

No actionable P0, P1, or P2 findings remain.

### Current interaction and technical checks

- Header navigation, mail link, and View Works link remain present.
- All 41 video buttons remain available in the DOM.
- Opening “灯神救人” produces exactly one dialog; the close control dismisses it.
- Desktop and mobile computed page backgrounds are `rgb(8, 8, 8)`.
- Browser warnings/errors after reload: none.
- `npm run build`: passed.
- `git diff --check`: passed.

### Follow-up polish

- P3: the white primary button is intentionally the brightest non-media element to preserve a clear action hierarchy.

final result: passed
