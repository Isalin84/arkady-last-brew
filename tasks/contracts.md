# Контракты между модулями (v1.0, фаза 1)

Все скрипты — классические, общая глобальная область. **Никогда не объявляй повторно** `canvas, ctx, W, H, VIEW, FOV` (только renderer.js), `$` (game.js). Порядок: `weapons-art, audio-manifest, audio, score, score-card, settings, levels, progression, scene-art, renderer, fx, enemies, ui, game`.

## Владение файлами (правь только своё; game.js — точечными вставками)
| Файл | Владелец |
|---|---|
| renderer.js, tests/renderer.test.cjs, `look:` строки в levels.js, новый блок **после** IIFE в конце scene-art.js (`SceneArt.floor=…`) | 1A рендер |
| enemies.js, tests/enemies.test.cjs, `ENEMY_TYPES` и `enemies:`/`boss:` строки в levels.js, ветки **внутри** `SceneArt.monster()`, audio.js (`GameAudio.synth`) | 1C враги |
| fx.js, weapons-art.js, `WEAPON_BASE/UPGRADES/applyLoadout` в progression.js, tests/fx.test.cjs, `gun()` в game.js | 1B оружие |
| settings.js, ui.js, index.html, style.css, tests/ui.test.cjs, обработчики ввода внизу game.js, tests/browser/* | 1D UX |
| score.js, score-card.js, `DIFFICULTY` в progression.js, `secrets:`/`par:` строки levels.js, tests/replay.test.cjs, tests/score.test.cjs | 1E реиграбельность |
| tasks/*, README.md, package.json, pages.yml | главная сессия (не трогать) |

Новые тест-файлы уже зарегистрированы (заглушки). Новые JS-файлы не создавай.

## Рендер
- `Renderer.render(view)` → `rects` — массив `{x,top,w,h,d,visible,enemy}` в координатах 960×470 для видимых живых врагов.
- `view` (game.js `frameView()`): `{player,map,props,enemies,items,shots,particles,extra,lights,decals,clock,levelIndex,level,stellaVisible,started,running,weapon,kick,hurt}`.
- `view.extra` = `[...EnemyAI.sprites(), ...GameFX.sprites()]` — billboard: `{x,y,img(canvas 128×128),size,z?,aspect?,hit?,flash?:0..1 (к белому),alpha?:0..1,fullbright?:bool,enemy?}`.
- Поля врага, которые читает рендер: `hit` (>0 → белая вспышка), `stagger` (>0 → покачивание), `dying` (0..1 — сплющивание, опционально).
- Частицы `GameFX.particles`: `{x,y,dx,dy,z,color:'#rrggbb',life,size?:число (по умолчанию 1),fullbright?}`.
- Динамический свет `GameFX.lights`: `{x,y,radius,intensity,color:[r,g,b],life}`; `GameFX.update` уменьшает `life` и удаляет. Рендер берёт до 4 ближайших.
- Декали `GameFX.decals`: `{x,y,v:0..1 (0 верх стены),size:в клетках (~.12),color:[r,g,b],alpha,life}` — точка на поверхности стены; рендер рисует их на колонках, где точка попадания луча ближе `size`.
- Настройка качества: `GameSettings.get('quality')` ∈ `'auto'|'high'|'medium'|'low'`; рендер слушает `GameSettings.on('quality',…)`. `Renderer.stats.avg` — среднее время кадра, мс.
- После открытия тайника: `map[y][x]=0; Renderer.onMapChange()`.

## Звук
- `GameAudio.synth?.(name,{pan,volume,distance})` — синтез через Web Audio (владелец 1C). Имена: `spit, splat, bossRoar, bossStomp, secret, combo, upgrade, hitmarker, stagger`. Вызывай с `?.` — у других треков до слияния метода нет.

## Оверлеи
- `EnemyAI.overlays(rects)` — полоски HP над ранеными врагами и полоса босса (рисуются на `ctx`). `GameUI.overlays(rects)` — хит-маркер, индикатор направления урона, FPS.
- `GameFX.hitMarker` (0..1, затухает), `GameFX.damageDir` (угол источника последнего урона в мировых координатах или null) — читает GameUI.

## Прогрессия, сложность, очки
- `runUpgrades` — массив id апгрейдов в game.js (1B), попадает в `checkpoint.upgrades`. После перехода между цехами: `GameUI.showUpgrades(choices,onPick)`; `choices` — `[{id,name,text,weapon}]`, `onPick(id|null)`. 1D рисует панель выбора; заглушка сразу вызывает `onPick(null)` — 1B должен работать и так.
- `GameSettings.get('difficulty')` ∈ `'rookie'|'normal'|'veteran'` — читается при `reset()` (1E применяет `DIFFICULTY`). 1D даёт выбор на стартовом экране; «Ветеран» открыт, если `GameScore.veteranUnlocked?.()`.
- `GameScore.combo` → `{mult,timer}` (1E), 1D показывает в HUD. Тайники: глобалы game.js `secretsFound`, `secretsTotal` (1E); HUD 1D показывает, если определены.
- Режим `'veteran'`: одна жизнь — гибель вызывает `reset()` с экраном «Смена провалена».
