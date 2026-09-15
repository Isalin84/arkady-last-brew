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

`voice/01.mp3`–`voice/15.mp3` are cuts of that take, normalized to -18 LUFS, -2 dBTP. Text and event assignments are in `audio.js`; exact source cut boundaries are in `voice/segments.json`. Reproduce the split with `python3 scripts/split-voice.py` (requires FFmpeg). No replacement or additional voice clone was created.

## Background music

`music/arkady-hunting.mp3` is derived from the user-provided `voice/Arkady Hunting.m4a` (228.32 s), supplied specifically as this game's background music. Original retained. Browser copy normalized to -18 LUFS / -2 dBTP, 44.1 kHz, 160 kbps MP3 with short edge fades. No external music source was substituted.

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
