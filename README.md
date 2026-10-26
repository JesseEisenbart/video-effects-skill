# video-effects

21 motion-graphics effects for vertical (1080x1920, 30 fps) talking-head footage, built as a Remotion project, plus a Claude skill that knows how to prepare a take, pick effects to match what is said, write the cut list and render it.

The look is light "glass" cards on a grey backdrop with critically damped springs. Several effects cut the speaker out of the room and put graphics behind them; the repo includes the pipeline that makes those cut-outs from a plain take.

## Use it as a Claude skill

Clone the repo into `~/.claude/skills/video-effects` (or a project's `.claude/skills/video-effects`), then ask Claude to edit your video. `SKILL.md` has the instructions Claude follows: setup, preparing your take, choosing effects for spoken cues, writing `src/edit/edit.json`, checking stills and rendering.

## Quick start

```sh
npm install
pip install -r requirements.txt   # numpy, pillow
npm run sample                    # synthetic take + masks + cut-outs in public/sample/ (needs ffmpeg)
npm run studio                    # Remotion Studio: FxShowcase, FxPreview, ExampleEdit
npm run render:showcase           # out/showcase.mp4, all 21 effects back to back
```

Other scripts: `npm run render:edit` renders `src/edit/edit.json` to `out/edit.mp4`; `npm run stills -- <outDir> <effectId> [from] [frame,frame]` renders stills of one effect; `npm run bench` times every effect; `npm run typecheck`.

## Your own footage

```sh
scripts/prepare-take.sh path/to/input.mov myname    # writes public/takes/myname/
```

The pipeline: ffmpeg transcodes to 1080x1920 at 30 fps (cover-crop), `tools/matte` writes a per-frame person mask with Apple Vision, `scripts/make-fg.py` turns the masks into smoothed, feathered RGBA cut-outs, `scripts/make-sticker-mattes.py` bakes the sticker border Paper Cutout uses, `tools/face` finds the face position, and the script writes `public/takes/myname/source.json` to paste into `src/edit/edit.json`.

The matte and face steps use Apple's Vision framework, so they are macOS only (they compile with `swiftc` from the Xcode command line tools). On other systems, produce the per-frame masks with any segmentation tool (grayscale PNGs named `0000.png`, `0001.png`, ... at the take's size, person white), continue from `make-fg.py`, and set `face` by hand from a still. `SKILL.md` has the details.

`public/sample/` and `public/takes/` are gitignored. Nothing you render from your own footage is tracked.

## The edit format

`src/edit/edit.json` is a cut list over one take: a `source` (video, cut-out folder, sticker folder, frame count, face position) and `segments` that play back to back. Each segment is plain footage (`aroll`) or an effect (`fx` with an `id`), starts at a source frame `at` and runs for `frames`. The voice comes from the take's own audio per segment, so with a continuous take each segment starts where the previous one ended. Effects bring their own sound cues; an optional `music` bed sits under everything.

## The 21 effects

| | id | What it does |
|--|----|--------------|
| 01 | `orbit` | A ring of app tiles circles the speaker's head, behind and in front |
| 02 | `chat-takeover` | The take shrinks into an attachment in a chat window; a prompt, a reply, steps tick off |
| 03 | `frame-escape` | The take becomes a tilted print and the speaker's head breaks out over its edge |
| 04 | `snap-zoom` | Slow creep, then a hard punch-in on the face |
| 05 | `checklist-pop` | Four glass pills appear beside the speaker and tick green |
| 06 | `headline-storm` | Headline banners slam in from both sides and pile up around the speaker |
| 07 | `zoom-portal` | A round inset pops up; the camera flies through it into a punch-in |
| 08 | `growth-curve` | A line chart draws behind the speaker while a counter climbs to 10x |
| 09 | `broll-overlay` | The take shrinks into an editor window; a clip drops onto V2 and an overlay cuts in |
| 10 | `paper-cutout` | The speaker becomes a white-bordered sticker on a paper poster |
| 11 | `magazine-cover` | A masthead, cover lines, barcode and badge land around the speaker |
| 12 | `liquid-glass` | A glass drop glides in, magnifies the face, and leaves |
| 13 | `zoom-through-cut` | Zoom-blur punch-in, cut on the blur, zoom back out |
| 14 | `green-screen` | A green backdrop wipes in behind the speaker, then a grey scene rises |
| 15 | `frame-break` | The grey scene cracks and shatters to reveal the room |
| 16 | `digital-zoom` | A viewfinder overlay; the shot steps in on the face and snaps back |
| 17 | `phone-mockup` | The take shrinks into a phone screen with a short-video UI |
| 18 | `checklist-tally` | Closing card: a counter and a list of 21 items ticking off |
| 19 | `glass-widgets` | Five frosted widgets rise around the speaker, behind and in front; counts run up, a ring fills, a render bar completes |
| 20 | `checklist` | A dark card rises over the chest and ticks off five steps: pending, working, done |
| 21 | `split` | A paper chart slides into the top half and pushes the shot down; bars grow, then an average line draws across |

Each lives in `src/fx/<Name>.tsx` with a header comment describing its motion and sound cues. The shared contract (`FxSource`, `ARoll`, `Cutout`, `useFace`, springs) is in `src/fx/shared.tsx`; the theme (colours, `GlassCard`, `Backdrop`) in `src/fx/theme.tsx`; the sound library in `src/fx/sfx.tsx`.

Some effects carry on-screen text written for a demo about editing with Claude. The strings are plain literals in each effect file; change them to fit your video.

## Licenses

- Code: see `LICENSE`.
- Fonts: Inter, Montserrat and Caveat in `public/fonts/` are under the SIL Open Font License 1.1 (`public/fonts/OFL.txt`).
- Sound effects in `public/sfx/` were generated with ElevenLabs for this project and are included for use with these effects.
- Remotion has its own license. Individuals and small companies can use it free; companies above a small size need a Remotion company license. See https://remotion.dev/license.

## Post it with PostZen

Once Claude has edited the reel, PostZen lets Claude post it. PostZen is an MCP server that connects Claude to your social accounts through their official APIs: publish, schedule, queue or draft posts (Instagram Reels, feed images, carousels and stories; LinkedIn and other networks), answer comments and DMs, run comment-to-DM automations, and read analytics. One command adds it:

```sh
claude mcp add --transport http postzen https://mcp.postzen.dev/mcp
```

https://www.postzen.dev/?utm_source=github&utm_medium=skill&utm_campaign=video-effects-skill. Agent quickstart: https://www.postzen.dev/agent-quickstart.md.

Made by Jesse Eisenbart, https://jesseeisenbart.com.
