# Audio sources

Acquired on 2026-09-08 from the user's signed-in Pixabay account (IvanS84). The effect pages display “Free for use under the Pixabay Content License”. Original source recordings are retained; the game plays short excerpts, varies playback rate and mixes them with positional gain.

| File | Recording / creator | Source |
|---|---|---|
| sfx/glass.mp3 | Glass Bottle Smash — Universfield | https://pixabay.com/sound-effects/film-special-effects-glass-bottle-smash-277554/ |
| sfx/can-open.mp3 | Beer Can Open Sound — Alex_Jauk | https://pixabay.com/sound-effects/film-special-effects-beer-can-open-sound-230903/ |
| sfx/footsteps.mp3 | concrete footsteps 1 — patchytherat (Freesound), via freesound_community | https://pixabay.com/sound-effects/film-special-effects-concrete-footsteps-1-6265/ |
| sfx/steam.mp3 | Air (or steam) pressure release — brunoboselli (Freesound), via freesound_community | https://pixabay.com/sound-effects/technology-air-or-steam-pressure-release-29600/ |

License reference: https://pixabay.com/service/license-summary/

## Arkady

Generated at the user's request in their ElevenLabs account, using the existing **Arkady Clone** voice, **Eleven Multilingual v2**, speed 1, stability 0.5, similarity 0.75, style 0, speaker boost on. One generation, 688 credits (balance 90,000 → 89,312). User saved the resulting `voice/Arkady Voice.mp3` to this project.

`voice/01.mp3`–`voice/15.mp3` are cuts of that take, normalized to -18 LUFS, -2 dBTP. Text and event assignments are in `audio-manifest.js`; exact source cut boundaries are in `voice/segments.json`. Reproduce the split with `python3 scripts/split-voice.py` (requires FFmpeg). No replacement or additional voice clone was created.

## Background music

`music/arkady-hunting.mp3` is derived from the user-provided `voice/Arkady Hunting.m4a` (228.32 s), supplied specifically as this game's background music. Original retained. Browser copy normalized to -18 LUFS / -2 dBTP, 44.1 kHz, 160 kbps MP3 with short edge fades. No external music source was substituted. Since v1.0 the browser copy is the streamed `music/arkady-hunting.webm` / `.m4a` pair described below; the MP3 was removed from the repository.

## v0.5 — two production departments (2026-09-15)

- `voice/16.mp3`–`29.mp3`: generated in the owner's signed-in ElevenLabs account with **Arkady Clone** (not Arkady), **Eleven Multilingual v2**, speed 1, stability 0.5, similarity 0.75, style 0, speaker boost on. 14 original Russian lines, separated by 1.5-second breaks. Take used 795 credits. Downloaded original retained in Downloads; split boundaries in `voice/segments-level2.json`. Dialogue normalized to −18 LUFS / −2 dBTP.
- `sfx/monster-large.mp3`: DavidDumaisAudio, [Large Monster Attack](https://pixabay.com/sound-effects/film-special-effects-large-monster-attack-195713/), downloaded from Pixabay under its Content License. Used for pallet golems and large microbes.
- `sfx/monster-small.mp3`: DavidDumaisAudio, [Small Monster Attack](https://pixabay.com/sound-effects/film-special-effects-small-monster-attack-195712/), downloaded from Pixabay under its Content License. Used for bottle creatures and small microbes.
- `sfx/monster-can.mp3`: ElevenLabs Sound Effects, generated in the owner's account, 2 seconds, loop off, influence 49%, variation 1 (80 credits for the four variants). Prompt: “A single aggressive attack snarl from a possessed aluminum beer can monster. Wet guttural goblin growl layered with sharp crushed metal creaks and a short pressurized hiss. Punchy scary comic horror game creature, close dry recording, no speech, no music, clean short decay.”
- All three creature samples normalized to −19 LUFS / −3 dBTP, with distance attenuation, stereo positioning, slight pitch variation and a shared rate limit in the game mixer. No separate external audio service is needed to play the game.

## v0.6 — warehouse (2026-09-15)

- `voice/30.mp3`–`43.mp3`: 14 original Russian lines generated in the owner's ElevenLabs account, **Arkady Clone**, **Eleven Multilingual v2**, speed 1, stability 0.5, similarity 0.75, style 0, speaker boost on. Main take downloaded as `ElevenLabs_2026-09-15T13_30_08_Arkady Clone_ivc_sp100_s50_sb75_se0_b_m2.mp3`; two short lines re-recorded in the 13:35:49 take because the first take omitted their separator. Originals retained in Downloads. Cut boundaries in `voice/segments-level3.json`, text in `voice/warehouse-script.json`. Normalized to −18 LUFS / −2 dBTP. The rescue dialogue does not reveal the trapped colleague's name.
- `sfx/forklift-engine.mp3`: **forklift starting**, soundman9826 (Freesound), distributed by freesound_community on [Pixabay](https://pixabay.com/sound-effects/city-forklift-starting-36156/). 12.38-second excerpt, Pixabay Content License.
- `sfx/forklift-beep.mp3`: **FORK TRUCK BEEP**, SamuelGremaud (Freesound), distributed by freesound_community on [Pixabay](https://pixabay.com/sound-effects/city-fork-truck-beep-68537/). Excerpt 0.60–3.60 seconds, Pixabay Content License. These two recordings were downloaded through the separate browser without account sign-in.
- `sfx/forklift-crash.mp3`: generated in the owner's ElevenLabs Sound Effects account, 2 seconds, loop off, prompt influence 49%, variation 1 (80 credits for four variants). Prompt: “A single violent crash of a possessed forklift slamming into a steel warehouse rack: heavy metallic impact, crunching chassis, short monstrous mechanical snarl, rattling forks and a fizz of electrical sparks. Punchy scary comic horror videogame enemy collision, close dry sound, quick clean decay, no voices, no music.” Original `A_single_violent_cra_#1-1789479062654.mp3` retained in Downloads.
- Vehicle effects normalized to −19 LUFS / −3 dBTP and routed through the existing effects volume control with distance attenuation, stereo positioning and rate limits.

## v0.7 — malt house and Stella rescue (2026-09-24)

- `voice/44.mp3`–`58.mp3`: 15 original Russian lines generated in the owner's signed-in ElevenLabs account with **Arkady Clone**, **Eleven Multilingual v2**, speed 1, stability 0.5, similarity 0.75, style 0, speaker boost on. Source take: `ElevenLabs_2026-09-24T09_37_14_Arkady Clone_ivc_sp100_s50_sb75_se0_b_m2.mp3`.
- `voice/59.mp3`–`60.mp3`: two Stella lines generated with the owner's Russian female My Voices entry displayed by ElevenLabs as **Essa** (the voice identified for Stella), using the same model and settings. Source take: `ElevenLabs_2026-09-24T09_38_54_Essa_gen_sp100_s50_sb75_se0_b_m2.mp3`.
- All 17 new clips are normalized to −18 LUFS / −2 dBTP, 44.1 kHz, 128 kbps MP3. Exact split boundaries are in `voice/segments-level4.json`; event text and speaker names are in `voice/malthouse-script.json` and `audio-manifest.js`.
- The new malt creatures reuse the existing licensed creature attacks with distinct pitch, rate, distance and stereo treatment in the mixer; no additional third-party recording was added.

## v0.7.2 — finale kiss (2026-09-24)

- `sfx/kiss.mp3`: **Kiss 242243** by Universfield, supplied by the user as `universfield-kiss-242243.mp3` for the Stella rescue finale. The game copy is normalized to −19 LUFS / −3 dBTP, 44.1 kHz, 128 kbps MP3 with short edge fades and follows the effects-volume control.

## v0.8 — runtime manifest (2026-09-24)

- `audio-manifest.js` binds every spoken line to its exact numbered MP3. Retired clips `14.mp3`, `29.mp3` and `43.mp3` remain in the source archive but are not loaded or published.
- The browser loads only the current chapter's speech pack. A failed request is eligible for retry on the next resume instead of staying permanently silent.

## v1.0 — four music tracks, streamed (2026-10-03)

All four tracks were supplied by the user as their own recordings for this game. The source MP3s (`music/Arkady is  Back.mp3`, `music/Lost Arkady.mp3`, `music/Victorious Arkady.mp3`, and `voice/Arkady Hunting.m4a` for the in-game track) stay outside Git (`.gitignore`) and are not published.

| Track | Browser files | Length | Plays | Loudness | Gain |
|---|---|---|---|---|---|
| Arkady is Back | `music/menu-arkady-is-back.webm` / `.m4a` | 3:03 | title screen (after the first click or key) and pause, looped | −15.6 LUFS | 0.81 |
| Arkady Hunting | `music/arkady-hunting.webm` / `.m4a` | 3:48 | during the shift, looped; continues after a pause, restarts on a new shift, retry or next department | −17.4 LUFS | 1 |
| Victorious Arkady | `music/victory-arkady.webm` / `.m4a` | 2:29 | department cleared and Stella rescued, once | −16.0 LUFS | 0.85 |
| Lost Arkady | `music/defeat-arkady.webm` / `.m4a` | 2:42 | death and failed veteran shift, once | −16.4 LUFS | 0.89 |

- Formats: Opus 96 kbps VBR in WebM (primary, chosen when `canPlayType('audio/webm; codecs="opus"')` answers yes) and AAC 128 kbps in M4A with the index at the front (fallback, e.g. older Safari). Cover art and metadata stripped. WebM total 8.9 MB versus 16.6 MB for the source MP3s; each browser downloads only one format.
- Loudness was measured as integrated LUFS; the per-track gains in `audio.js` bring every track to the in-game track's level instead of re-encoding the masters.
- Commands (FFmpeg, macOS AudioToolbox AAC encoder):

```sh
ffmpeg -i SRC -vn -map_metadata -1 -c:a libopus -b:a 96k -vbr on -application audio OUT.webm
ffmpeg -i SRC -vn -map_metadata -1 -c:a aac_at -aac_at_mode cvbr -b:a 128k -movflags +faststart OUT.m4a
```

- Playback: one streaming `<audio>` element per track routed through Web Audio (track gain → music bus), 0.6 s crossfades. Music starts after the first seconds arrive instead of after a full download and decode; effects and speech start loading once the current track can play (at most 1.5 s later).
