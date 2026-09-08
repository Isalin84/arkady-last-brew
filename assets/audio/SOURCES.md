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
