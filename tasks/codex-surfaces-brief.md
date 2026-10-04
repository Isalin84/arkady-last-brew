# Задание для Codex: нарисованные стены, пол и потолок

Это задание на картинки. Код не трогай.

Нужно нарисовать текстуры стен, дверей, пола и потолка для всех четырёх цехов. Генерация — через встроенный генератор картинок (GPT Image 2.5). Потом картинки нужно сделать бесшовными, проверить, сжать и разложить по путям ниже.

Подключение в игру (`scene-art.js`, `renderer.js`, тесты, workflow) потом сделает Claude. Поэтому:

- JS, CSS, HTML, тесты и workflow не меняй.
- Ничего не коммить.
- В конце заполни раздел «Отчёт».

Принцип тот же, что у предметов в [codex-props-brief.md](codex-props-brief.md):

- сначала по одной базовой текстуре на каждую поверхность;
- варианты делаются правкой базовой.

Отличие от спрайтов: фона нет. Текстура заполняет кадр целиком, от края до края, и **должна стыковаться сама с собой**.

## Как текстура работает в игре

**Стена.** Один кадр — один участок стены высотой от пола до потолка.

- Нижний край кадра стоит на полу, верхний упирается в потолок.
- Уровень глаз — 50% высоты. Таблички вешай на 45–52%.
- По горизонтали участки идут подряд, поэтому стены (кроме дверей) должны быть **бесшовными по горизонтали**: левый край продолжает правый.
- По вертикали стена не повторяется.

**Пропорции стены.** В игре участок стены на экране шире, чем выше, примерно 7:4. Поэтому:

- холст стены — 1792×1024;
- рисуй с естественными пропорциями: кирпич выглядит как кирпич, круглый манометр остаётся круглым.

Старые текстуры в референсах квадратные, и в игре их растягивает по горизонтали. Не копируй их пропорции, бери только раскладку и цвета.

**Пол и потолок.** Один квадратный кадр — одна клетка карты, вид строго сверху (пол) или строго снизу (потолок). Клетки повторяются во все стороны, поэтому базовая текстура **бесшовная по обеим осям**.

**Свет.** Освещение, цветные лампы и туман игра накладывает сама. Нужно:

- ровное рассеянное освещение без бликов, теней и виньетки;
- никаких ламп, светильников и светящихся пятен в кадре. Потолочные лампы игра рисует сама.

**Яркость.** Средняя яркость каждой текстуры должна остаться близкой к старой, иначе освещение уровня поедет. Допуск ±15%, его проверяет скрипт. Если промахнулся, разрешено выровнять яркость всей картинки целиком.

**Таблички.** Тот же стиль, что на оборудовании:

- тёмно-бирюзовая плашка `#102d38`;
- тонкая золотая рамка `#e0bd65`;
- кремовые заглавные буквы `#f4dfab`.

Текст строго как в задании, других надписей нет. На полу и потолке надписей нет совсем.

**Скорость.** Кадр от этого не замедлится. Текстура в игре 448×256 (стены) или 256×256 (пол и потолок). Важны только размеры и вес, соблюдай лимиты.

## Референсы

Все в `assets/art/source/`:

| Файл | Роль |
|---|---|
| `cover-monsters.png` | **Image 1 — стиль и материалы.** Медь, сталь, латунь, кафель и крашеный металл пивоварни |
| `ref-surfaces/<имя>.png` | **Image 2 — раскладка.** Текущая текстура из игры, увеличенная в 4 раза. Имя совпадает с целевым файлом. Что где расположено, основные цвета. Это грубая заглушка: перерисуй её как живой материал |
| `ref-surfaces/context-<цех>.png` | **Image 3 — контекст.** Скриншот цеха сейчас: соседние стены и нарисованное оборудование, с которым текстура должна сочетаться |

Цеха: `brew` — варочный, `pack` — упаковка и розлив, `warehouse` — склад, `malt` — солодовня.

## Общие правила

1. **Модель.**
   - Разведка: `gpt-image-2.5-flare`, качество `medium`.
   - Финал: `gpt-image-2.5-sunburst`, качество `high`.
   - Если модель и размер выбрать нельзя (в прошлый раз генератор не давал), пиши формат словами в промпте.
2. **Формат генерации.**
   - Стены и двери: широкий кадр 7:4, мастер `1792x1024`.
   - Пол и потолок: квадрат, мастер `1024x1024`.
   - Фон непрозрачный, output `png`.
   - Если генератор вернул другой размер, приведи масштабированием. Пропорции можно исказить не больше чем на 4%.
3. **Порядок работы.**
   1. Все базовые текстуры: стены, двери, `floor-*-0`, `ceiling-*-0`.
   2. Общий просмотр по цехам. Стиль должен быть единым, цеха должны отличаться друг от друга.
   3. Сделать базовые текстуры бесшовными (см. ниже).
   4. Варианты — правкой бесшовной базы. Список Preserve повторяй целиком.
   5. Склейка краёв вариантов с базой, сжатие, проверка.
4. **Одна правка за итерацию.** Если кадр верен на 80%, правь его, а не генерируй заново. Если нужно поменять две вещи (например, материал и надпись), делай две правки подряд.
5. **Оригиналы.** PNG-мастера сохраняй в `assets/art/source/surfaces/`. WebP — в `assets/art/`. Промпты, которые реально ушли в генератор, — в `assets/art/source/surfaces/prompts.json`.

### Как сделать бесшовной

Генератор редко сам выдаёт идеальный стык. Порядок такой:

1. **Сетка — в промпте.** У структурных материалов (плитка, кирпич, доски, рёбра, панели) в промпте задано целое число элементов на кадр. Шов сетки проходит по краю кадра, по половине толщины на каждом краю.
2. **Подгонка.** Если генератор ошибся в шаге сетки, разрешено обрезать и масштабировать так, чтобы шаг укладывался ровно (искажение до 4%).
   - Полосы вдоль края кадра центрируй на этом крае. Это балки и прогоны потолка, швы досок, швы плитки. Пример: генератор нарисовал балку целиком в верхних 11%. Сдвинь картинку вниз на половину ширины балки, чтобы половина балки ушла к нижнему краю.
   - Иначе на стыке клеток граница «балка — плита» окажется на краю кадра. Скрипт примет её за шов.
   - Положения в промптах базы («top 11%») указаны до этого сдвига. Варианты правятся уже по сдвинутой базе, поэтому проценты в их Change считай от неё.
3. **Сдвиг на половину.** Сдвинь картинку на 50% (`roll`) по нужной оси. Шов окажется крестом в центре.
4. **Лечение шва.** Лучший способ — правка сдвинутой картинки:

   > Change: repaint only the seam band, about 12% wide, through the center, so the material continues smoothly across it. Preserve: everything outside the band, the grid positions, colors and lighting.

   Потом сдвинь обратно.

   Для неструктурных участков (бетон, эпоксидка, пятна, пыль, текстура дерева) можно вместо правки смешать полосу шва с мягкой маской на Python. Смешивать нельзя там, где проходят линии: они двоятся.

**Варианты.** Чтобы вариант стыковался с соседними клетками базы, после правки верни на его края пиксели базы:

- полоса 4% по краям, указанным в столбце «Стык с базой»;
- мягкий переход ещё на 4%.

Если элемент варианта пересекает край (линия, труба, лоток), этот край не трогай. Вместо этого сделай вариант бесшовным по этой оси, как выше.

**Разрешённая постобработка:**

- обрезка, масштаб, сдвиг;
- лечение и смешивание шва;
- возврат краёв базы;
- выравнивание яркости всей картинки.

Рисовать содержимое кодом нельзя.

### Style lock — вставляй дословно в каждый промпт базовой текстуры

```text
Style lock: hand-painted semi-realistic game texture for a retro first-person shooter set in an old Soviet-era brewery, matching the painting style and the copper, steel, brass, tile and painted-metal materials in Image 1; a perfectly flat orthographic view straight at the surface with zero perspective; even flat diffuse light with no cast shadows, no vignette, no glare and no light sources in frame, because the game adds its own lighting; big readable shapes and clear value contrast that stay legible when shrunk to 256 px; light wear, scratches and grime; the surface fills the whole canvas edge to edge with no border, no frame and no background.
```

### Framing — одна из трёх строк, дословно

Стена:

```text
Framing: one flat wall section from floor to ceiling, seen straight on, wide 7:4 canvas; the bottom edge of the canvas is where the wall meets the floor and the top edge is where it meets the ceiling; natural proportions; horizontally seamless — the left edge continues exactly into the right edge.
```

Дверь — та же строка, но вместо последней части: `a single door filling the section, not tiled.`

Пол:

```text
Framing: one square floor cell seen straight down from above, square 1:1 canvas; a seamless tileable texture — the left edge continues exactly into the right edge and the top edge into the bottom edge.
```

Потолок:

```text
Framing: one square ceiling cell seen straight up from below, square 1:1 canvas; a seamless tileable texture — the left edge continues exactly into the right edge and the top edge into the bottom edge.
```

### Шаблон базовой текстуры

```text
Create a <KIND> texture of <NAME> for a brewery first-person shooter.

Image 1: style reference — match the painting style and brewery materials of this key art.
Image 2: layout reference — the current low-resolution game texture; keep where each element sits and the main colors, and repaint it as a rich, believable material. Ignore its proportions.
Image 3: in-game context — the surface must sit naturally next to this painted equipment.

Subject: <SUBJECT>

<Style lock line>

<Framing line>

Use Case: tiling surface texture in a raycaster game, seen up close and from far away.

Constraints:
- One flat surface only: no objects standing in front of it, no people, no lamps, no light spots.
- Label plates (walls only) are dark teal (#102d38) with a thin gold border (#e0bd65) and cream capitals (#f4dfab); their text is exactly as quoted and there is no other text.
- Floors and ceilings carry no text at all.
```

`<KIND>`: `wall`, `door`, `floor` или `ceiling`.

### Шаблон варианта (правка базовой текстуры)

Image 1 = готовая бесшовная базовая текстура этой поверхности.

```text
Edit Image 1.

Change: <CHANGE>

Preserve: the material, colors, grid and joint positions, painting style, flat even lighting, the orthographic view, and the outer 15% border on every edge that the change does not cross.

Constraints:
- Exactly the change described, nothing else added.
- No text, no lamps, no light spots.
- The texture still fills the canvas edge to edge.
```

---

## Файлы

Итого **38 текстур**:

- 11 стен и дверей: WebP 448×256, каждая до 40 КБ;
- 15 полов и 12 потолков: WebP 256×256, каждая до 30 КБ;
- общий вес до 1,2 МБ.

### Обозначения в таблицах

- **Бесшовность.** `x` — левый край продолжает правый; `y` — верхний продолжает нижний; `xy` — обе оси; `—` — не нужна.
- **Стык с базой.** Края, на которые возвращаются пиксели базы: `t` — верх, `b` — низ, `l` — лево, `r` — право.

Все размеры и положения ниже — в процентах кадра: по горизонтали слева, по вертикали сверху.

---

## 01 — Варочный цех (`brew`)

Медь, тёплый кафель, тёмно-зелёная масляная краска.

### `wall-brew` — основная стена

Бесшовность `x`.

```text
Subject: a wall of glazed ceramic bricks in pale olive-khaki (#8a8466) laid in running bond with dark grout (#3f493d), exactly 7 brick courses from the top edge down to a thin brass trim strip (#d7bb70) at 68% height, each course holding exactly 6 bricks across the canvas; below the trim, down to the floor, a dark green oil-painted wall panel (#384a3b) with scuffs and boot marks near the bottom; bricks show slight color variation, soft glaze, chipped corners and faint wort splashes.
```

### `wall-brew-panel-a` — медная панель котла

Бесшовность `x`. Б и В делаются правкой этой панели, поэтому края у всех трёх одинаковые.

```text
Subject: a riveted wall panel of a brew kettle: a central warm copper sheet (#c89155) with soft vertical brushed sheen; pale steel horizontal rails (#ced7cc) at 6–10% and 88–92% height; along both side edges a riveted steel frame strip 5% wide (#38505a) with round rivets; at eye level, centered at 48% height, one sign plate reading "ВАРКА · 98°C"; at lower left (20% across, 71% down) a red cast-iron valve handwheel; at lower right (74% across, 68% down) a round pressure gauge with a cream dial.
```

### `wall-brew-panel-b` — стальная панель фильтрации

Бесшовность `x`, стык с базой `lr`. База — `wall-brew-panel-a`.

Две правки подряд:

1. `Change: replace only the central copper sheet with cold brushed stainless steel (#6f8b90) with a faint blue cast.`
2. `Change: change only the sign text to exactly "ФИЛЬТРАЦИЯ", same plate, same size, same position.`

Дополнительно к Preserve: `the side frame strips, rails, rivets, valve, gauge and the plate position.`

### `wall-brew-panel-c` — панель танка

Бесшовность `x`, стык с базой `lr`. Image 1 = готовая `wall-brew-panel-b`.

`Change: change only the sign text to exactly "ТАНК · 04", same plate, same size, same position; add a few different scratches on the steel sheet.`

### `door-exit` — выход

Бесшовность `—`. Используется в цехах 01 и 02.

```text
Subject: a heavy steel exit door painted bottle green (#1d3427) filling the section, set in a dark steel door frame along the sides and top; a cream painted inset line (#d8c88a) around the door leaf; a steel push bar across at 55% height; one sign plate centered at 30% height reading "ВЫХОД"; below it a large cream arrow pointing right (→) centered at 72% height.
```

### `floor-brew-0` — плитка

Бесшовность `xy`.

```text
Subject: worn ochre-brown quarry tiles (#776749) on a brewhouse floor, exactly 2 by 2 square tiles per canvas; dark grout lines (#262117) run along the canvas edges (half the grout width on each edge) and through the vertical and horizontal center lines; faint wort stains, scuffs, small chipped corners and fine grit.
```

### `floor-brew-1` — та же плитка, другой оттенок

Бесшовность `xy`, стык с базой `tblr`. Лежит в шахматном порядке с `-0`.

`Change: shift the four tiles to a slightly darker, greener tone (#6e5f43) and move the stains to different spots; keep every grout line exactly where it is.`

### `floor-brew-2` — сливной трап

Бесшовность `xy`, стык с базой `tblr`.

`Change: add a square stainless-steel floor drain grate, 30% of the canvas wide, centered exactly on the crossing of the center grout lines, with a darker damp ring around it.`

### `floor-brew-3` — лужа сусла

Бесшовность `xy`, стык с базой `tblr`.

`Change: add a dried amber-brown wort puddle with darker glossy edges, spreading over the lower-left part of the inner area, staying inside the central 70% of the canvas.`

### `ceiling-brew-0` — бетонное перекрытие

Бесшовность `xy`.

```text
Subject: the underside of a concrete slab painted dark green-grey (#33463f) with damp stains and fine spatter; a dark steel joist (#1b2826) runs horizontally across the full width along the top 11% of the canvas, with a row of bolts.
```

### `ceiling-brew-1` — медная труба

Бесшовность `x`, стык с базой `tb`.

`Change: add a copper pipe (#a8632f) running horizontally across the full width, centered at 54% height and 8% thick, held by two dark steel hanger straps that rise to the joist at 20% and 70% across.`

### `ceiling-brew-2` — кабельный лоток

Бесшовность `y`, стык с базой `lr`.

`Change: add a galvanized ladder cable tray running vertically across the full height, centered at 40% across and 17% wide, carrying red, blue and grey cables.`

---

## 02 — Упаковка и розлив (`pack`)

Холодный голубой кафель, тёмно-синяя краска, жёлтая разметка.

### `wall-pack` — основная стена

Бесшовность `x`.

```text
Subject: a wall of pale blue-grey ceramic tiles (#a1b7b8) with grey-blue grout (#536f7b), exactly 8 tiles across and 5 rows from the top edge down to a yellow painted trim stripe (#e0bf61) at 63–66% height; a dark electrical conduit pipe (#203b4a) with a pale highlight and small clamps runs horizontally across the full width at 12–14% height; below the trim, down to the floor, a navy-blue oil-painted wall panel (#294e63) with scuffs near the bottom.
```

### `floor-pack-0` — эпоксидный пол

Бесшовность `xy`.

```text
Subject: a blue-grey industrial epoxy floor (#5b7380) with soft mottled trowel marks, fine speckle and light scuffs; a thin saw-cut joint runs along the canvas edges (half its width on each edge).
```

### `floor-pack-1` — другой оттенок

Бесшовность `xy`, стык с базой `tblr`.

`Change: shift the floor to a slightly darker tone (#566e7b) and rearrange the mottling; keep the edge joints exactly where they are.`

### `floor-pack-2` — жёлтая линия снизу

Бесшовность `x`, стык с базой `t`.

`Change: add a worn yellow safety line (#d8b63c) running horizontally across the full width at 87–95% height.`

### `floor-pack-3` — жёлтая линия сверху

Бесшовность `x`, стык с базой `b`.

`Change: add a worn yellow safety line (#d8b63c) running horizontally across the full width at 5–13% height.`

### `floor-pack-4` — зона под машиной

Бесшовность `xy`, стык с базой нет.

`Change: repaint the whole floor as a dark grey machine zone (#39403f) fully covered with worn diagonal yellow and black hazard stripes at 45 degrees, exactly 4 yellow stripes across the canvas so they continue across every edge.`

### `ceiling-pack-0` — подвесной потолок

Бесшовность `xy`.

```text
Subject: a suspended acoustic ceiling of exactly 4 by 4 square dark blue-grey panels (#30495a) with a fine porous surface, held by a thin dark metal T-bar grid (#1f3440) that runs along the canvas edges (half its width on each edge) and between the panels.
```

### `ceiling-pack-1` — воздуховод

Бесшовность `x`, стык с базой `tb`.

`Change: add a galvanized rectangular air duct (#7e9099) running horizontally across the full width from 33% to 64% height, with flange bands at 0%, 50% and 100% across.`

### `ceiling-pack-2` — кабельный лоток

Бесшовность `y`, стык с базой `lr`.

`Change: add a galvanized ladder cable tray running vertically across the full height, centered at 40% across and 17% wide, carrying red, blue and grey cables.`

---

## 03 — Склад (`warehouse`)

Профлист, бетон, стеллажи, жёлто-чёрная разметка.

### `wall-warehouse` — основная стена

Бесшовность `x`.

```text
Subject: a wall of corrugated steel cladding (#697b80) with exactly 12 vertical trapezoid ribs across the canvas, light rust streaks and dents; a yellow-and-black diagonal hazard band (#dcb448) across the full width at 70–76% height, with exactly 8 black stripes across; below it, down to the floor, a dark steel kick plate (#35444c) with scuffs.
```

### `wall-rack` — стеллаж с коробками

Бесшовность `x`.

```text
Subject: the face of a warehouse pallet rack against a dark back wall (#25343d): orange steel shelf beams (#c57432) span the full width at 30%, 60% and 90% height; on each beam stand exactly 3 cardboard boxes (#ac8753) of slightly different sizes, with brown tape, white shipping stickers and stencil marks; perforated blue-grey steel uprights (#546a72) run the full height along both side edges, half an upright on each edge, so neighboring sections share one upright.
```

### `door-malt` — дверь в солодовню

Бесшовность `—`. Используется в цехах 03 и 04.

```text
Subject: a wide dark teal steel door (#1c313a) with vertical ribs filling the section, set in a steel frame; a gold painted header bar (#d8b349) across the top at 5–9% height; two sign plates centered across, the first at 37% height reading "СОЛОДОВНЯ" and the second at 52% height reading "СИЛОС 04"; a large gold arrow pointing right (→) centered at 78% height.
```

### `floor-warehouse-0` — бетон

Бесшовность `xy`.

```text
Subject: a grey concrete warehouse floor (#686660) with fine aggregate speckle, faint tyre marks and a thin hairline crack; saw-cut expansion joints run along the canvas edges (half their width on each edge) and one vertical joint runs through the center at 50% across.
```

### `floor-warehouse-1` — масляное пятно

Бесшовность `xy`, стык с базой `tblr`.

`Change: add a dark oil stain with a slightly glossy edge, a little right of center, staying inside the central 70% of the canvas.`

### `floor-warehouse-2` — разметка проезда

Бесшовность `y`, стык с базой `tb`.

`Change: add worn yellow painted lane dashes (#e2b53b) along the left and right edges, each stripe 6% wide hugging its edge, dashed from 5% to 45% and from 55% to 95% height.`

### `ceiling-warehouse-0` — профнастил на балке

Бесшовность `xy`.

```text
Subject: a corrugated steel roof deck (#2b343d) seen from below, with exactly 8 ribs running vertically across the full height; a dark steel I-beam (#171c21) runs horizontally across the full width along the top 12% of the canvas, with bolted plates.
```

### `ceiling-warehouse-1` — спринклерная магистраль

Бесшовность `x`, стык с базой `tb`.

`Change: add a red sprinkler main pipe (#9b2f22) running horizontally across the full width, centered at 54% height and 6% thick, with one brass sprinkler head pointing down at 50% across and two hangers rising to the beam at 20% and 80% across.`

### `ceiling-warehouse-2` — кабельный лоток

Бесшовность `y`, стык с базой `lr`.

`Change: add a galvanized ladder cable tray running vertically across the full height, centered at 40% across and 17% wide, carrying red, blue and grey cables.`

---

## 04 — Солодовня (`malt`)

Бежевый кирпич, дерево, солодовая пыль, нержавеющая сталь силосов.

### `wall-malt` — основная стена

Бесшовность `x`.

```text
Subject: a wall of warm beige brick (#9b8c72) in running bond with grey-brown mortar (#61584d), exactly 6 courses from the top edge down to a gold painted trim (#d4af37) at 69–72% height, each course holding exactly 5 bricks across the canvas; pale malt dust settled on the brick ledges; directly below the trim a row of short dark diagonal hazard slashes, then a dark teal oil-painted wall panel (#263f48) down to the floor, with scuffs near the bottom.
```

### `wall-silo` — силосный ряд

Бесшовность `x`.

```text
Subject: the flat face of a bank of brushed stainless-steel malt silos (#9fb0b0) with exactly 12 vertical seams across the canvas; dark teal steel bands (#263d45) across the full width at 7–12% and 87–92% height, studded with brass rivets; one sign plate centered at 52% height reading "СОЛОД · ЛИНИЯ 04".
```

### `floor-malt-0` — дощатый пол

Бесшовность `xy`.

```text
Subject: worn wooden floor planks (#8e7a56) running horizontally, exactly 4 planks per canvas, each 25% of the height, with the plank seams along the top edge and at 25%, 50% and 75% height; staggered butt joints with pairs of nail heads; pale malt dust and husks caught in the seams.
```

### `floor-malt-1` — просыпанный солод у стены

Бесшовность `x`, стык с базой `b`.

`Change: add a band of spilled pale malt grain (#d9bd7a) along the top edge, from 0% to 6% height, across the full width, with a few loose grains below it.`

### `floor-malt-2` — кучка солода

Бесшовность `xy`, стык с базой `tblr`.

`Change: add a small spilled heap of golden malt grain (#d0ad62) in the center with scattered grains around it, staying inside the central 70% of the canvas.`

### `ceiling-malt-0` — дощатый потолок

Бесшовность `xy`.

```text
Subject: a dusty dark wooden board ceiling (#3b342b) seen from below, exactly 8 boards running vertically across the canvas; a heavy dark timber beam (#2a231b) runs horizontally across the full width along the top 16% of the canvas; dust and old cobweb wisps in the corners of the beam.
```

### `ceiling-malt-1` — стальная труба

Бесшовность `x`, стык с базой `tb`.

`Change: add a grey steel pipe (#727b78) running horizontally across the full width, centered at 54% height and 7% thick, held by two hangers rising to the beam at 20% and 70% across.`

### `ceiling-malt-2` — брус-обрешётка

Бесшовность `y`, стык с базой `lr`.

`Change: add a narrow dark timber batten (#1a1612) running vertically across the full height, centered at 50% across and 4% wide.`

---

## Сжатие

Мастера в `assets/art/source/surfaces/` должны быть без альфа-канала.

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter/assets/art"
for f in source/surfaces/*.png; do n=$(basename "$f" .png)
 case $n in wall-*|door-*) w=448;; *) w=256;; esac
 cwebp -q 82 -m 6 -sharp_yuv -resize $w 256 "$f" -o "$n.webp"
done
```

Если файл тяжелее лимита, снижай `-q` шагами по 4, но не ниже 70.

## Проверка (обязательно перед отчётом)

Скрипт проверяет:

- размер, вес, отсутствие альфы;
- бесшовность — стык краёв по сравнению с соседними столбцами внутри;
- стык вариантов с базой;
- яркость относительно старой текстуры.

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter" && python3 - <<'EOF'
from PIL import Image, ImageStat
import os
A='assets/art';R=A+'/source/ref-surfaces';W=(448,256);F=(256,256)
S={}
def add(n,size,tile='',base=None,match=''):S[n]=(size,tile,base,match)
for n in ['wall-brew','wall-brew-panel-a','wall-pack','wall-warehouse','wall-rack','wall-malt','wall-silo']:add(n,W,'x')
for n in ['wall-brew-panel-b','wall-brew-panel-c']:add(n,W,'x','wall-brew-panel-a','lr')
for n in ['door-exit','door-malt']:add(n,W)
V={'brew':[('xy','tblr'),('xy','tblr'),('xy','tblr')],'pack':[('xy','tblr'),('x','t'),('x','b'),('xy','')],
   'warehouse':[('xy','tblr'),('y','tb')],'malt':[('x','b'),('xy','tblr')]}
for l,vs in V.items():
    add(f'floor-{l}-0',F,'xy');add(f'ceiling-{l}-0',F,'xy')
    for i,(t,m) in enumerate(vs,1):add(f'floor-{l}-{i}',F,t,f'floor-{l}-0',m)
    add(f'ceiling-{l}-1',F,'x',f'ceiling-{l}-0','tb');add(f'ceiling-{l}-2',F,'y',f'ceiling-{l}-0','lr')
def lum(im):return im.convert('L')
def line(g,axis,i):
    w,h=g.size;return list(g.crop((i,0,i+1,h)).getdata()) if axis=='x' else list(g.crop((0,i,w,i+1)).getdata())
def diff(a,b):return sum(abs(x-y) for x,y in zip(a,b))/len(a)
def seam(g,axis):
    # The wrap edge must look like an ordinary inner step: compare it with the 90th percentile of all inner neighbor steps.
    n=g.size[0] if axis=='x' else g.size[1];L=[line(g,axis,i) for i in range(n)]
    inner=sorted(diff(L[i],L[i+1]) for i in range(n-1))
    return diff(L[0],L[n-1])/max(1,inner[int(len(inner)*.9)])
def ring(g,e,k=3):
    w,h=g.size;box={'t':(0,0,w,k),'b':(0,h-k,w,h),'l':(0,0,k,h),'r':(w-k,0,w,h)}[e];return list(g.crop(box).getdata())
total=0;fails=0;imgs={}
for n in S:
    p=f'{A}/{n}.webp'
    if os.path.exists(p):imgs[n]=Image.open(p)
for n,(size,tile,base,match) in S.items():
    if n not in imgs:print('MISSING',n);fails+=1;continue
    im=imgs[n];g=lum(im);k=os.path.getsize(f'{A}/{n}.webp');total+=k
    lim=(40 if size==W else 30)*1024;alpha=im.mode in('RGBA','LA') and im.getchannel('A').getextrema()[0]<255
    src=os.path.exists(f'{A}/source/surfaces/{n}.png')
    seams={a:seam(g,a) for a in tile}
    edges={e:diff(ring(g,e),ring(lum(imgs[base]),e)) for e in match} if base in imgs else {}
    ref=ImageStat.Stat(lum(Image.open(f'{R}/{n}.png'))).mean[0];L=ImageStat.Stat(g).mean[0]/ref
    ok=im.size==size and k<=lim and not alpha and src and all(v<=1.5 for v in seams.values()) and all(v<=10 for v in edges.values()) and .85<=L<=1.15
    fails+=not ok
    print('OK ' if ok else 'FAIL',n,im.size,f'{k//1024} KB','seam',{a:round(v,2) for a,v in seams.items()},'edge',{e:round(v,1) for e,v in edges.items()},f'lum={L:.2f}',''if src else'NO-PNG')
print(f'Textures: {len(imgs)}/{len(S)}; total {total//1024} KB (limit 1200); failures: {fails}')
EOF
```

Пороги:

- `seam` — шов не больше чем в 1,5 раза резче, чем 90% шагов между соседними столбцами внутри;
- `edge` — средняя разница края с базой не больше 10 из 255;
- `lum` — яркость 0,85–1,15 от старой.

Глазами проверь:

1. **Сетка 3×3.** Для каждой бесшовной текстуры собери сетку из девяти копий (для стен — ряд из трёх) в `assets/art/source/surfaces/tiles/<имя>.png`. Швов и повторяющегося «пятна-маркера», которое бросается в глаза, быть не должно.
2. **Варианты рядом с базой.** Положи каждый вариант рядом с базой: стык не виден, трубы, лотки и линии продолжаются в соседний такой же вариант.
3. **Надписи без ошибок.** «ВАРКА · 98°C», «ФИЛЬТРАЦИЯ», «ТАНК · 04», «ВЫХОД», «СОЛОДОВНЯ», «СИЛОС 04», «СОЛОД · ЛИНИЯ 04».
4. **Вид.** Нет перспективы, теней, ламп и светлых пятен. Двери и стены заполняют кадр от пола до потолка.
5. **Мелкий размер.** Текстура читается при 128 px: видно, что это кирпич, плитка, доски, профлист.

## Отчёт (заполняет Codex)

### Модель и качество

Использован встроенный `imagegen`, непрозрачный PNG. Инструмент не раскрывает модель и не предоставляет селекторы `flare` / `sunburst` и `medium` / `high`; поэтому подтвердить эти конкретные режимы нельзя. Формат и размеры задавались словами. Полученные изображения — 1659×948 (иногда 1660×948) и 1254×1254; мастера приведены к 1792×1024 и 1024×1024. Искажение пропорций менее 0,1%, в пределах допуска 4%.

Все 64 фактических вызова, полные отправленные промпты, входные референсы и пути результатов записаны в `assets/art/source/surfaces/prompts.json`. Для каждой базы переданы `cover-monsters.png`, одноимённая текстура `ref-surfaces` и контекст цеха. Варианты использовали готовую бесшовную базу; панель B изменена двумя отдельными вызовами, панель C — правкой B. Исправления швов использовали сдвинутый мастер. Временные входные референсы дополнительно сохранены в `source/surfaces/inputs/`, соответствия указаны в `archived_references`.

### Итерации и правки

Готовы **17 баз и 21 вариант, всего 38 текстур**. PNG-мастера: `assets/art/source/surfaces/`; WebP: `assets/art/`. Все мастера RGB, без альфа-канала. Сжатие `cwebp -q 82 -m 6 -sharp_yuv`; снижать качество не понадобилось. Общий вес — **481.9 КиБ**.

64 вызова: 17 базовых генераций, 22 правки для 21 варианта, 5 правок количества рядов/кадрирования, 15 первичных правок швов, 1 повторная правка стыка пола розлива и 4 дополнительные итерации его диагональной разметки. Неудачные результаты не удалены; журнал сохраняет историю.

У кирпича варки уточнены семь рядов, у солодовни — шесть. Дверь выхода перекадрирована: дверь и рамка заполняют весь участок, табличка **«ВЫХОД»** читается на уменьшенной текстуре. Количество полос опасной зоны генератор сначала не соблюдал; после более плотного варианта квадрат обрезан до четырёх периодов без изменения пропорций ([20, 20, 1192, 1192] исходного 1254×1254), затем шов вылечен генеративно.

Балки потолка центрированы на внешней границе циклическим сдвигом, чтобы при повторении не удваивались. Полы варки, розлива и склада обрезаны на 5 px с каждой стороны после нормализации для совмещения краевого шва. Из каждой генеративной правки шва взяты только пиксели указанной полосы: остальное сохранено из исходника. Структурные линии не смешивались; мягкое смешивание использовано только при обязательном возврате краёв вариантов к базе. Яркость всех текстур выровнена одним множителем для всей картинки; у вариантов это сделано перед возвратом краёв. Подробности и коэффициенты — `processing.json`.

| Текстура | Обработка стыка |
|---|---|
| `wall-brew` | Правка центральной полосы 12% после roll; обратный roll. |
| `wall-brew-panel-a` | Исходная рамка уже проходит проверку; правка шва отклонена, поскольку удаляла часть рамки. |
| `wall-brew-panel-b` | Правка базы; возврат краёв `lr`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `wall-brew-panel-c` | Правка базы; возврат краёв `lr`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `door-exit` | Не повторяется; масштаб и общая яркость. |
| `floor-brew-0` | Правка центральной полосы 12% после roll; обратный roll. |
| `floor-brew-1` | Правка базы; возврат краёв `tblr`: 4% + мягкий переход 4%. Исходный стык по `xy` проходит проверку. |
| `floor-brew-2` | Правка базы; возврат краёв `tblr`: 4% + мягкий переход 4%. Исходный стык по `xy` проходит проверку. |
| `floor-brew-3` | Правка базы; возврат краёв `tblr`: 4% + мягкий переход 4%. Исходный стык по `xy` проходит проверку. |
| `ceiling-brew-0` | Правка центральной полосы 12% после roll; обратный roll. |
| `ceiling-brew-1` | Правка базы; возврат краёв `tb`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `ceiling-brew-2` | Правка базы; возврат краёв `lr`: 4% + мягкий переход 4%. Исходный стык по `y` проходит проверку. |
| `wall-pack` | Правка центральной полосы 12% после roll; обратный roll. Регистрация сетки: x=-22 px. |
| `floor-pack-0` | Правка центральной полосы 12% после roll; обратный roll. Дополнительная правка вертикального шва. Регистрация сетки: x=+14 px. |
| `floor-pack-1` | Правка базы; возврат краёв `tblr`: 4% + мягкий переход 4%. Исходный стык по `xy` проходит проверку. |
| `floor-pack-2` | Правка базы; возврат краёв `t`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `floor-pack-3` | Правка базы; возврат краёв `b`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `floor-pack-4` | Обрезка квадрата до четырёх периодов; roll xy; генеративная правка центрального креста 12%; обратный roll. Края базы не возвращаются. |
| `ceiling-pack-0` | Правка центральной полосы 12% после roll; обратный roll. |
| `ceiling-pack-1` | Правка базы; возврат краёв `tb`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `ceiling-pack-2` | Правка базы; возврат краёв `lr`: 4% + мягкий переход 4%. Исходный стык по `y` проходит проверку. |
| `wall-warehouse` | Правка центральной полосы 12% после roll; обратный roll. |
| `wall-rack` | Правка центральной полосы 12% после roll; обратный roll. Регистрация сетки: x=-10 px. |
| `door-malt` | Не повторяется; масштаб и общая яркость. |
| `floor-warehouse-0` | Правка центральной полосы 12% после roll; обратный roll. Регистрация сетки: x=-8 px. |
| `floor-warehouse-1` | Правка базы; возврат краёв `tblr`: 4% + мягкий переход 4%. Исходный стык по `xy` проходит проверку. |
| `floor-warehouse-2` | Правка базы; возврат краёв `tb`: 4% + мягкий переход 4%. Исходный стык по `y` проходит проверку. |
| `ceiling-warehouse-0` | Правка центральной полосы 12% после roll; обратный roll. |
| `ceiling-warehouse-1` | Правка базы; возврат краёв `tb`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `ceiling-warehouse-2` | Правка базы; возврат краёв `lr`: 4% + мягкий переход 4%. Исходный стык по `y` проходит проверку. |
| `wall-malt` | Правка центральной полосы 12% после roll; обратный roll. |
| `wall-silo` | Правка центральной полосы 12% после roll; обратный roll. Регистрация сетки: x=+22 px. |
| `floor-malt-0` | Правка центральной полосы 12% после roll; обратный roll. |
| `floor-malt-1` | Правка базы; возврат краёв `b`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `floor-malt-2` | Правка базы; возврат краёв `tblr`: 4% + мягкий переход 4%. Исходный стык по `xy` проходит проверку. |
| `ceiling-malt-0` | Правка центральной полосы 12% после roll; обратный roll. |
| `ceiling-malt-1` | Правка базы; возврат краёв `tb`: 4% + мягкий переход 4%. Исходный стык по `x` проходит проверку. |
| `ceiling-malt-2` | Правка базы; возврат краёв `lr`: 4% + мягкий переход 4%. Исходный стык по `y` проходит проверку. |

Превью повторения сохранены в `source/surfaces/tiles/`: стены — ряд 1×3, пол/потолок — 3×3. Двери не повторяются. Сравнения вариантов с базой — `source/surfaces/comparisons/`; общий обзор в размере 128 px — `tiles/preview-128.png`. Проверены все четыре цеха, таблички и продолжение труб, лотков и разметки между одинаковыми вариантами.

### Вывод скрипта проверки

Запущен скрипт из задания без изменения порогов. Использован Python с Pillow из bundled runtime; предупреждения об устаревшем `getdata()` подавлены, вычисления неизменны. Дополнительно проверены точные размеры и RGB всех 38 PNG-мастеров и суммарный лимит 1200 КиБ.

```text
OK  wall-brew (448, 256) 15 KB seam {'x': 0.72} edge {} lum=1.00 
OK  wall-brew-panel-a (448, 256) 24 KB seam {'x': 0.63} edge {} lum=1.00 
OK  wall-pack (448, 256) 12 KB seam {'x': 0.64} edge {} lum=1.00 
OK  wall-warehouse (448, 256) 19 KB seam {'x': 0.4} edge {} lum=1.00 
OK  wall-rack (448, 256) 27 KB seam {'x': 0.46} edge {} lum=0.99 
OK  wall-malt (448, 256) 20 KB seam {'x': 1.05} edge {} lum=1.00 
OK  wall-silo (448, 256) 21 KB seam {'x': 0.15} edge {} lum=1.00 
OK  wall-brew-panel-b (448, 256) 23 KB seam {'x': 0.57} edge {'l': 1.5, 'r': 0.8} lum=0.99 
OK  wall-brew-panel-c (448, 256) 24 KB seam {'x': 0.57} edge {'l': 0.7, 'r': 0.7} lum=0.99 
OK  door-exit (448, 256) 15 KB seam {} edge {} lum=1.00 
OK  door-malt (448, 256) 22 KB seam {} edge {} lum=1.00 
OK  floor-brew-0 (256, 256) 8 KB seam {'x': 1.29, 'y': 0.82} edge {} lum=1.00 
OK  ceiling-brew-0 (256, 256) 6 KB seam {'x': 1.0, 'y': 1.13} edge {} lum=1.00 
OK  floor-brew-1 (256, 256) 9 KB seam {'x': 1.22, 'y': 0.83} edge {'t': 2.2, 'b': 2.6, 'l': 2.3, 'r': 2.6} lum=1.01 
OK  floor-brew-2 (256, 256) 9 KB seam {'x': 0.95, 'y': 0.48} edge {'t': 2.2, 'b': 2.4, 'l': 2.2, 'r': 2.5} lum=1.01 
OK  floor-brew-3 (256, 256) 9 KB seam {'x': 1.17, 'y': 0.88} edge {'t': 2.2, 'b': 2.3, 'l': 2.2, 'r': 2.6} lum=1.00 
OK  ceiling-brew-1 (256, 256) 7 KB seam {'x': 1.28} edge {'t': 1.7, 'b': 1.5} lum=1.00 
OK  ceiling-brew-2 (256, 256) 7 KB seam {'y': 0.86} edge {'l': 1.6, 'r': 1.4} lum=1.01 
OK  floor-pack-0 (256, 256) 7 KB seam {'x': 0.94, 'y': 1.28} edge {} lum=1.00 
OK  ceiling-pack-0 (256, 256) 8 KB seam {'x': 1.31, 'y': 1.48} edge {} lum=1.00 
OK  floor-pack-1 (256, 256) 7 KB seam {'x': 0.84, 'y': 1.2} edge {'t': 2.3, 'b': 2.8, 'l': 2.2, 'r': 1.4} lum=1.00 
OK  floor-pack-2 (256, 256) 8 KB seam {'x': 0.97} edge {'t': 2.3} lum=1.00 
OK  floor-pack-3 (256, 256) 8 KB seam {'x': 0.98} edge {'b': 2.8} lum=1.00 
OK  floor-pack-4 (256, 256) 12 KB seam {'x': 1.01, 'y': 1.03} edge {} lum=1.00 
OK  ceiling-pack-1 (256, 256) 9 KB seam {'x': 0.92} edge {'t': 2.2, 'b': 2.4} lum=0.99 
OK  ceiling-pack-2 (256, 256) 7 KB seam {'y': 0.63} edge {'l': 2.0, 'r': 2.3} lum=1.01 
OK  floor-warehouse-0 (256, 256) 12 KB seam {'x': 1.11, 'y': 1.28} edge {} lum=1.00 
OK  ceiling-warehouse-0 (256, 256) 4 KB seam {'x': 0.15, 'y': 0.64} edge {} lum=1.00 
OK  floor-warehouse-1 (256, 256) 11 KB seam {'x': 1.18, 'y': 1.31} edge {'t': 2.3, 'b': 2.9, 'l': 2.5, 'r': 2.9} lum=1.00 
OK  floor-warehouse-2 (256, 256) 13 KB seam {'y': 1.14} edge {'t': 1.9, 'b': 2.7} lum=1.00 
OK  ceiling-warehouse-1 (256, 256) 5 KB seam {'x': 0.16} edge {'t': 0.9, 'b': 1.3} lum=1.00 
OK  ceiling-warehouse-2 (256, 256) 5 KB seam {'y': 0.66} edge {'l': 1.7, 'r': 1.2} lum=1.01 
OK  floor-malt-0 (256, 256) 17 KB seam {'x': 0.61, 'y': 0.55} edge {} lum=1.00 
OK  ceiling-malt-0 (256, 256) 6 KB seam {'x': 0.32, 'y': 1.04} edge {} lum=1.00 
OK  floor-malt-1 (256, 256) 18 KB seam {'x': 0.67} edge {'b': 2.1} lum=1.00 
OK  floor-malt-2 (256, 256) 19 KB seam {'x': 0.47, 'y': 0.48} edge {'t': 2.5, 'b': 2.2, 'l': 1.4, 'r': 2.0} lum=1.00 
OK  ceiling-malt-1 (256, 256) 6 KB seam {'x': 0.39} edge {'t': 1.5, 'b': 1.3} lum=1.00 
OK  ceiling-malt-2 (256, 256) 5 KB seam {'y': 1.38} edge {'l': 1.9, 'r': 2.2} lum=1.00 
Textures: 38/38; total 481 KB (limit 1200); failures: 0
```

### Что спорно или не получилось

- Генератор не даёт подтвердить конкретный идентификатор модели/качества, указанный в задании.
- На металле осталось мягкое нарисованное отражение материала; явных ламп, световых пятен, падающих теней и перспективы нет. Сильнее всего это заметно на медной панели.
- Крупные пятна, трап и кучка солода узнаваемо повторяются в диагностической сетке 3×3. Такие варианты стоит ставить отдельными клетками и перемежать с базой; постоянное повторение одной и той же клетки будет видно. Это ограничение раскладки, а не разрыв стыка.
- Сетка и диагонали рисованные: возможны небольшие неровности линий. Проверки швов проходят, геометрического сглаживания или рисования содержимого кодом не выполнялось.
- Ассеты подготовлены локально. В соответствии с заданием подключение в игру, коммит и публикация не выполнялись. `assets/art/source/` уже исключён из Git; для передачи исходников нужно сохранить эту локальную папку.
