# Задание для Codex: новая графика «Последней варки»

Это задание на картинки. Код не трогай.

Нужно сгенерировать картинки через встроенную генерацию изображений (GPT Image 2.5), проверить их, сжать и разложить по путям ниже. Подключение в игру (`index.html`, `style.css`, `ui.js`, `game.js`, `weapons-art.js`, `score-card.js`, `.github/workflows/pages.yml`) потом сделает Claude. Поэтому:

- JS, CSS, HTML, тесты и workflow не меняй.
- Ничего не коммить. Файлы оставь неотслеживаемыми.
- В конце заполни раздел «Отчёт» внизу этого файла.

## Контекст

Игра — браузерный шутер на Canvas-рейкастере. Хостинг — GitHub Pages, поэтому важен вес файлов.

Сюжет. Пивовар-ветеран Аркадий (около 60 лет) в ночную смену зачищает заражённую пивоварню от монстров-микробов и спасает коллегу Стеллу.

Фирменная палитра:

| Цвет | Код |
|---|---|
| Тёмно-синий | `#0b1d3a` |
| Синий рабочей формы | `#1d2f5a` |
| Горчичное золото | `#d4a937` |
| Медь | `#b8733e` |

Тон юмористический хоррор, без крови. Монстры: Дикие дрожжи, Пенная плесень, Кисляк, Дрожжевой плевун, Солодовый клещ и босс Солодовый король.

## Референсы (прикладывай как картинки к промпту)

| Файл | Роль |
|---|---|
| `assets/art/arkady-cover.png` | Лицо, причёска, возраст и рабочая рубашка Аркадия, манера отрисовки |
| `assets/art/stella-kisses-arkady.png` | Текущий финальный кадр: композиция и позы |
| `assets/art/stella-rescued-full.png` | Лицо и форма Стеллы |

## Общие правила

1. **Модель.** Разведку делай на `gpt-image-2.5-flare` с качеством `medium`. Финал — `gpt-image-2.5-sunburst` с качеством `high`. Если модель выбрать нельзя, это допустимо, но формат и фон тогда пиши словами, как в промптах.
2. **Одна правка за итерацию.** Если картинка верна на 80%, правь её через Change / Preserve / Constraints, а не генерируй заново. Список Preserve повторяй целиком в каждой итерации.
3. **Прозрачность.** Прозрачный фон проверяй по альфа-каналу файла скриптом из раздела «Проверка». Шахматка на превью ничего не доказывает.
4. **Оригиналы.** Сохраняй PNG в `assets/art/source/`. Сжатые WebP клади в `assets/art/` — их забирает GitHub Pages, папку без изменения workflow не создавай.
5. **Именование.** Имена файлов строго как в таблицах. Код будет ссылаться именно на них.

---

## 1. Обложка с монстрами (стартовый экран)

**Как кадр стоит в игре.** Картинка растягивается на всю сцену 16:9 (`object-fit: cover`).

- На десктопе кадр смещён к правой части (`object-position: 67% top`).
- Слева поверх кадра идут заголовок «ПОСЛЕДНЯЯ ВАРКА», текст и кнопки на тёмном градиенте. Левые ~40% должны быть спокойными и тёмными.
- В правом нижнем углу лежит плашка «Аркадий» (ширина 36%, отступ снизу 7%). Важных деталей там быть не должно.

**Параметры генерации:**

- Model: `gpt-image-2.5-sunburst`
- Quality: `high` (разведка — `gpt-image-2.5-flare` с качеством `medium`)
- Size: `2560x1440`
- Background: непрозрачный
- Референс: Image 1 = `assets/art/arkady-cover.png`

```text
Create a landscape 16:9 title-screen key art for a comedic-horror first-person shooter set in a brewery.

Image 1: identity and rendering reference — Arkady's face, grey swept-back hair, stubble, age, navy work shirt, and the painterly semi-realistic rendering style.

Scene: the brewhouse of an old Soviet-era brewery during the night shift. Tall hammered-copper brew kettles, brushed stainless fermentation tanks, pipes with brass pressure gauges, steel catwalks with yellow railings, and tall factory windows on the right throwing warm amber light into hazy steam. The brewery is infested: behind the hero, in the mid-ground and background, microbe monsters crawl out of the tanks and pipes —
- three glossy lime-green wild-yeast blobs (#b6c955) the size of a dog, with clusters of small yellow eyes and wide toothy grins, oozing over a catwalk;
- a hunched creature made of dripping beige beer foam (#d5a94d) climbing the side of a copper kettle;
- a lanky purple sour-mash imp (#c2b3d6) peeking around a pipe with a mischievous grin;
- a yeast spitter with a swollen throat sac on a railing, mid-spit, a glob of glowing green slime in the air;
- high in the back left, half hidden in steam, the huge silhouette of the Malt King (#d4af37): a hulking crowned giant built from packed malt grain, with two glowing amber eyes.
The monsters are softly lit and partly veiled by haze, so they read as a looming threat behind him.

Subject: Arkady from Image 1, same face and identity, standing in the right third of the frame, waist-up, arms crossed, holding a green glass beer bottle loosely in his right hand against his left forearm. He looks straight at the camera with a calm, sly half-smile, completely unbothered by the monsters behind his back.

Important Details:
- Composition for a game menu: the left 40% of the frame is darker and calmer — deep navy shadow (#0b1d3a), steam and distant tanks, with only one yeast blob dimly visible there — because the title text is overlaid on that side later.
- Arkady's face sits around 68% from the left and 35% from the top. The bottom-right corner is quiet: just his dark navy shirt and forearms.
- Lighting: warm amber rim light from the windows on the right, cool navy ambient fill, small glowing accents from the monsters' eyes and slime.
- Palette: navy #0b1d3a, copper #b8733e, warm gold #d4a937, lime-green monster accents.
- Rendering: painterly semi-realistic digital painting matching Image 1, fine fabric and metal texture, natural skin, light film grain.

Use Case: hero key art and title-screen background for a browser game.

Constraints:
- Arkady keeps the exact face and identity from Image 1.
- Arkady is the only human in the image; each of his hands shows five fingers.
- The monsters stay behind him and his face stays fully clear.
- The image contains zero text, letters, logos or watermarks; bottle and tanks are unlabeled.
```

**Если результат не устраивает (одна правка за раз):**

- Монстры теряются → `Change: make the monsters 20% larger and slightly brighter. Preserve: Arkady's face, pose, position, lighting, palette, left-side dark area, framing.`
- Лицо уплыло → `Change: restore Arkady's face to match Image 1 exactly. Preserve: everything else in the current image.`

| Файл | Формат |
|---|---|
| `assets/art/source/cover-monsters.png` | Оригинал 2560×1440 |
| `assets/art/cover-monsters.webp` | 1920×1080, не тяжелее 320 КБ |

---

## 2. Оружие в руках (вид от первого лица, прозрачный фон)

**Что сейчас не так.** Оружие сейчас нарисовано процедурно (`weapons-art.js`) и выглядит коряво:

- банка висит над кулаком, пальцы её не обхватывают;
- пробкомёт и пенная пушка смотрят стволом в потолок, а не вперёд.

**Как кадр стоит в игре.** Кадр 6:5 рисуется внизу по центру сцены, на него смотрят в упор. Поэтому:

- руки входят снизу и обрезаются нижним краем кадра;
- верхние ~25% кадра пустые;
- центр кадра сверху (там прицел) свободен.

### Общие для всех пяти картинок оружия

**Параметры генерации:**

- Model: `gpt-image-2.5-sunburst`
- Quality: `high`
- Size: `1440x1200`
- Background: `transparent`, output `png`

**Style lock.** Эту строку вставляй **дословно** в каждый промпт оружия и иконок:

```text
Style lock: hand-painted semi-realistic game art, crisp dark-brown outline around the silhouette, warm key light from the upper left, soft cool fill from the right, rich natural colors, brewery palette of copper #b8733e, brass #d9a05a, bottle green #2d5430, work-uniform navy #1d2f5a and mustard gold #d4a937, isolated on a transparent background, clean alpha edges, no drop shadow, no background plate.
```

**Руки Аркадия.** Эту строку тоже вставляй **дословно**:

```text
Hands: Arkady's weathered hands of a 60-year-old brewer — tanned skin, prominent knuckles, a few age spots, short clean nails, light grey forearm hair; sleeves of a navy cotton work jacket (#1d2f5a) with a mustard-gold piping stripe (#d4a937) at the buttoned cuff.
```

**Порядок генерации:**

1. Сначала 2A (бутылка).
2. Затем 2B и 2E делай правкой 2A, чтобы рука совпала.
3. 2C и 2D генерируй с 2A как референсом стиля и рукава.

### 2A. Бутылка «Смена №7» IPA — правая рука

```text
Create a first-person view of a right hand holding a beer bottle, as seen by the player in a shooter game, on a transparent background, 6:5 frame.

Scene: empty transparent background; this is a cut-out layer drawn over the game view.

Subject: Arkady's right hand grips a 0.5 L green glass beer bottle around its lower body. The bottle stands upright, tilted about 10 degrees to the left, neck up. Amber beer is visible through the glass, with a creamy foam line under the neck, a brass crown cap and condensation droplets.
- Neck label: cream paper with "№7" in dark green serif.
- Body label: dark green with a thin gold border, reading "СМЕНА №7" on the first line and "IPA" larger on the second line, in cream serif capitals.

Hands: Arkady's weathered hands of a 60-year-old brewer — tanned skin, prominent knuckles, a few age spots, short clean nails, light grey forearm hair; sleeves of a navy cotton work jacket (#1d2f5a) with a mustard-gold piping stripe (#d4a937) at the buttoned cuff.

Important Details:
- The forearm enters from the bottom edge, right of center, angled up and to the left, and is cut off by the bottom edge of the frame.
- All four fingers wrap around the front of the bottle and the thumb rests on its left side, so the glass sits inside the fist.
- Bottle center at about 60% from the left; the cap sits at about 20% from the top.
- The top-center area of the frame stays empty.

Style lock: hand-painted semi-realistic game art, crisp dark-brown outline around the silhouette, warm key light from the upper left, soft cool fill from the right, rich natural colors, brewery palette of copper #b8733e, brass #d9a05a, bottle green #2d5430, work-uniform navy #1d2f5a and mustard gold #d4a937, isolated on a transparent background, clean alpha edges, no drop shadow, no background plate.

Use Case: first-person weapon sprite for a browser shooter, viewed large on screen.

Constraints:
- Exactly one hand with five fingers and a correctly placed thumb.
- Label text is exactly "СМЕНА №7", "IPA" and "№7" (Cyrillic С-М-Е-Н-А), with no other words.
- The background stays fully transparent.
```

### 2B. Банка «Котёл 13» стаут — правка 2A

Image 1 = результат 2A.

```text
Edit Image 1.

Change: replace the bottle with a tall 0.5 L aluminium beer can of dark stout. The can wrap is dark brown (#3c2a1e) with two thin gold bands near the top and bottom and large cream-gold capitals: "КОТЁЛ" on the first line and a big "13" on the second line. The lid is slightly domed from pressure, the pull tab is open, and a thin curl of beige foam escapes from it — the can is a pressurised "explosive brew". All four fingers wrap around the front of the can's lower half and the thumb rests on its left side, so the can clearly sits inside the fist.

Preserve: hand and sleeve design, cuff stripe, skin tone, forearm position, angle and scale, frame position, lighting direction, outline style, transparent background.

Constraints:
- Exactly one hand with five fingers.
- Can text is exactly "КОТЁЛ" and "13" (Cyrillic К-О-Т-Ё-Л), with no other words.
- The background stays fully transparent.
```

### 2C. Пробкомёт — две руки

Image 1 = результат 2A, как референс стиля, кожи и рукава.

```text
Create a first-person view of two hands holding a cork-launcher gun, as seen by the player in a classic shooter, on a transparent background, 6:5 frame.

Image 1: style, skin and sleeve reference only — match the rendering, outline, hands and navy sleeves.

Scene: empty transparent background; a cut-out layer drawn over the game view.

Subject: a steampunk brewery "cork launcher". A compact riveted copper receiver with a small dark-green enamel plate reading "ПРОБКОМЁТ" in cream capitals. A short steel barrel wrapped in a coiled spring ends in a flared brass muzzle with a champagne cork seated in it. On the left side sits a round revolver drum loaded with seven light-brown champagne corks, and a polished wooden pistol grip is underneath.

Hands: Arkady's weathered hands of a 60-year-old brewer — tanned skin, prominent knuckles, a few age spots, short clean nails, light grey forearm hair; sleeves of a navy cotton work jacket (#1d2f5a) with a mustard-gold piping stripe (#d4a937) at the buttoned cuff.

Important Details:
- Seen from directly behind and slightly above, like the player's own view down the gun.
- The barrel points forward into the scene, toward the upper center of the frame. The muzzle is foreshortened and smaller than the receiver; the muzzle tip sits at about 50% from the left and 32% from the top.
- The right hand holds the wooden grip at the bottom right; the left hand supports the drum and receiver from below at the bottom left.
- Both forearms enter from the bottom edge and are cut off by it.
- The top quarter of the frame stays empty.

Style lock: hand-painted semi-realistic game art, crisp dark-brown outline around the silhouette, warm key light from the upper left, soft cool fill from the right, rich natural colors, brewery palette of copper #b8733e, brass #d9a05a, bottle green #2d5430, work-uniform navy #1d2f5a and mustard gold #d4a937, isolated on a transparent background, clean alpha edges, no drop shadow, no background plate.

Use Case: first-person weapon sprite for a browser shooter, viewed large on screen.

Constraints:
- Exactly two hands, five fingers each.
- The gun points away from the viewer, never at the ceiling.
- The plate text is exactly "ПРОБКОМЁТ" (Cyrillic П-Р-О-Б-К-О-М-Ё-Т), with no other words.
- The background stays fully transparent.
```

### 2D. Пенная пушка — две руки

Image 1 = результат 2A, как референс стиля, кожи и рукава.

```text
Create a first-person view of two hands holding a foam cannon, as seen by the player in a classic shooter, on a transparent background, 6:5 frame.

Image 1: style, skin and sleeve reference only — match the rendering, outline, hands and navy sleeves.

Scene: empty transparent background; a cut-out layer drawn over the game view.

Subject: a brewery "foam cannon". The main part is a brushed-steel body with two copper bands that ends in a wide flared copper trumpet nozzle. The nozzle mouth is filled with thick creamy white beer foam, with a few bubbles spilling over the rim. On the right side are a small brass pressure gauge with a cream dial and a red needle. A compact bottle-green pressure tank (#2d5430) is strapped along the left side, with a cream label reading "ПЕНА" in dark green capitals, connected to the body by a braided black hose. A dark-green rubberised grip is underneath.

Hands: Arkady's weathered hands of a 60-year-old brewer — tanned skin, prominent knuckles, a few age spots, short clean nails, light grey forearm hair; sleeves of a navy cotton work jacket (#1d2f5a) with a mustard-gold piping stripe (#d4a937) at the buttoned cuff.

Important Details:
- Seen from directly behind and slightly above, like the player's own view down the cannon.
- The nozzle points forward into the scene, toward the upper center of the frame. The trumpet is foreshortened; its mouth is centered at about 52% from the left and 30% from the top.
- The right hand holds the grip at the bottom right; the left hand grips the tank and body at the bottom left.
- Both forearms enter from the bottom edge and are cut off by it.
- The top quarter of the frame stays empty.

Style lock: hand-painted semi-realistic game art, crisp dark-brown outline around the silhouette, warm key light from the upper left, soft cool fill from the right, rich natural colors, brewery palette of copper #b8733e, brass #d9a05a, bottle green #2d5430, work-uniform navy #1d2f5a and mustard gold #d4a937, isolated on a transparent background, clean alpha edges, no drop shadow, no background plate.

Use Case: first-person weapon sprite for a browser shooter, viewed large on screen.

Constraints:
- Exactly two hands, five fingers each.
- The cannon points away from the viewer, never at the ceiling.
- The tank text is exactly "ПЕНА" (Cyrillic П-Е-Н-А), with no other words.
- The background stays fully transparent.
```

### 2E. Пустая рука после броска — правка 2A

Нужна для анимации броска бутылки и банки. Image 1 = результат 2A.

```text
Edit Image 1.

Change: remove the bottle completely. The hand is now open just after throwing: palm facing forward and slightly down, fingers spread and relaxed, the thumb pointing up-left.

Preserve: sleeve and cuff design, skin tone, wrist and forearm position, angle and scale, frame position, lighting direction, outline style, transparent background.

Constraints:
- Exactly one hand with five fingers.
- Nothing is held in the hand.
- The background stays fully transparent.
```

### Файлы оружия

| Оригинал PNG 1440×1200 | WebP 960×800 с альфой, не тяжелее 140 КБ |
|---|---|
| `assets/art/source/weapon-bottle.png` | `assets/art/weapon-bottle.webp` |
| `assets/art/source/weapon-can.png` | `assets/art/weapon-can.webp` |
| `assets/art/source/weapon-corker.png` | `assets/art/weapon-corker.webp` |
| `assets/art/source/weapon-foamer.png` | `assets/art/weapon-foamer.webp` |
| `assets/art/source/weapon-hand-release.png` | `assets/art/weapon-hand-release.webp` |

---

## 3. Иконки оружия без рук (HUD и карточки «Арсенала»)

Сейчас в слотах HUD и в карточках «Арсенала» видны обрезки рук. Нужны чистые предметы.

**Параметры генерации:**

- Model: `gpt-image-2.5-flare`
- Quality: `high`
- Size: `1024x1024`
- Background: `transparent`, output `png`
- Image 1 = соответствующая картинка из раздела 2: предмет должен совпасть.

Шаблон промпта. Подставь `<ITEM>` и `<TEXT>` из таблицы ниже.

```text
Create a game inventory icon of <ITEM>, shown alone without hands, at a three-quarter angle, centered, filling about 80% of the square frame.

Image 1: design reference — copy the item's exact shape, materials, colors and label from Image 1.

Style lock: hand-painted semi-realistic game art, crisp dark-brown outline around the silhouette, warm key light from the upper left, soft cool fill from the right, rich natural colors, brewery palette of copper #b8733e, brass #d9a05a, bottle green #2d5430, work-uniform navy #1d2f5a and mustard gold #d4a937, isolated on a transparent background, clean alpha edges, no drop shadow, no background plate.

Use Case: small HUD weapon-slot icon, must read clearly at 64 px.

Constraints:
- A single object, no hands.
- The label text is exactly <TEXT>, with no other words.
- The background stays fully transparent.
```

| `<ITEM>` | `<TEXT>` | Оригинал → WebP 256×256, не тяжелее 30 КБ |
|---|---|---|
| the green «Смена №7» IPA beer bottle | "СМЕНА №7", "IPA" | `source/icon-bottle.png` → `assets/art/icon-bottle.webp` |
| the «Котёл 13» stout can | "КОТЁЛ", "13" | `source/icon-can.png` → `assets/art/icon-can.webp` |
| the cork launcher gun | "ПРОБКОМЁТ" | `source/icon-corker.png` → `assets/art/icon-corker.webp` |
| the foam cannon | "ПЕНА" | `source/icon-foamer.png` → `assets/art/icon-foamer.webp` |

---

## 4. Финал: Стелла спасена (правка в высоком качестве)

Текущий кадр `stella-kisses-arkady.png` (1672×941) мягкий и мыльный. Задача — тот же кадр в высоком качестве.

**Как кадр стоит в игре.** Кадр показывается на весь экран финала (`object-position: center`). Слева на ~40% затемнение и текст. Тот же кадр используется в карточке результата.

**Параметры генерации:**

- Model: `gpt-image-2.5-sunburst`
- Quality: `high`
- Size: `2560x1440`
- Референсы:
  - Image 1 = `assets/art/stella-kisses-arkady.png` (основа);
  - Image 2 = `assets/art/stella-rescued-full.png` (Стелла);
  - Image 3 = `assets/art/arkady-cover.png` (Аркадий).

```text
Edit Image 1 into a higher-fidelity landscape 16:9 version.

Image 1: base image — composition, poses, framing, background and lighting.
Image 2: Stella's identity — face, long dark hair, white hard hat, navy coverall with gold piping.
Image 3: Arkady's identity — face, grey hair, stubble.

Change: raise the rendering quality only.
- Sharp, natural faces with real skin texture matching Image 2 and Image 3.
- Crisp hard-hat plastic with scuffs.
- Visible cotton weave and stitching on both navy uniforms with mustard-gold piping.
- Clean anatomically correct hands: Stella's left hand rests flat on Arkady's chest, and Arkady's right arm is around her shoulders.
- Detailed metal silos and pipes with glowing malt grain.
- Warm golden backlight with fine dust particles in the air.

Preserve: the kiss on the cheek, Arkady's sly happy smile and sideways glance, both poses, both hard hats, the camera angle and framing, subject placement right of center, the darker navy left side, the background silos and pipes, the round yellow "BEST PRACTICE" logo sign on the right wall, the colour palette and the light direction.

Constraints:
- Exactly two people; every hand has five fingers.
- The only text in the image is the existing logo sign, unchanged.
- No new objects are added.
```

| Файл | Формат |
|---|---|
| `assets/art/source/finale-stella.png` | Оригинал 2560×1440 |
| `assets/art/finale-stella.webp` | 1920×1080, не тяжелее 300 КБ |

---

## Сжатие

`cwebp` уже установлен (`/opt/homebrew/bin/cwebp`).

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter/assets/art"
cwebp -q 80 -m 6 -resize 1920 1080 source/cover-monsters.png -o cover-monsters.webp
cwebp -q 82 -m 6 -resize 1920 1080 source/finale-stella.png -o finale-stella.webp
for n in bottle can corker foamer hand-release; do cwebp -q 86 -alpha_q 95 -exact -m 6 -resize 960 800 source/weapon-$n.png -o weapon-$n.webp; done
for n in bottle can corker foamer; do cwebp -q 86 -alpha_q 95 -exact -m 6 -resize 256 256 source/icon-$n.png -o icon-$n.webp; done
```

Если файл тяжелее лимита, снижай `-q` шагами по 4. Ниже 70 не опускайся — тогда напиши об этом в отчёте.

## Проверка (обязательно перед отчётом)

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter" && python3 - <<'EOF'
from PIL import Image
import os
spec={'cover-monsters':((1920,1080),False,320),'finale-stella':((1920,1080),False,300)}
for n in ['bottle','can','corker','foamer','hand-release']:spec['weapon-'+n]=((960,800),True,140)
for n in ['bottle','can','corker','foamer']:spec['icon-'+n]=((256,256),True,30)
for name,(size,alpha,kb) in spec.items():
    p=f'assets/art/{name}.webp';im=Image.open(p);w,h=im.size;k=os.path.getsize(p)//1024
    ok=im.size==size and k<=kb
    if alpha:
        a=im.convert('RGBA').getchannel('A');corners=[a.getpixel(c) for c in [(0,0),(w-1,0),(0,h-1)]]
        ok=ok and max(corners)==0
        if name.startswith('weapon'):ok=ok and a.crop((0,0,w,h//6)).getextrema()[1]<16  # top of the frame stays empty
        if name.startswith('weapon') and name!='weapon-hand-release':
            ok=ok and a.crop((0,h-4,w,h)).getextrema()[1]==255  # arms reach the bottom edge
    print('OK ' if ok else 'FAIL',name,im.size,f'{k} KB')
EOF
```

Для картинок оружия скрипт проверяет: верхняя шестая часть кадра пустая, а руки доходят до нижнего края. Исключение — пустая рука 2E: у неё проверка нижнего края не делается.

Глазами проверь:

- лицо Аркадия на обложке и в финале узнаётся по `arkady-cover.png`;
- у всех рук ровно пять пальцев;
- надписи без ошибок: «СМЕНА №7», «IPA», «КОТЁЛ 13», «ПРОБКОМЁТ», «ПЕНА»;
- пробкомёт и пенная пушка смотрят вперёд, а не вверх;
- рука в 2A, 2B и 2E одна и та же.

## Отчёт (заполняет Codex)

- Модель и качество по каждой картинке: использована встроенная `image_gen`, точный выбор модели и уровня качества в доступном инструменте отсутствует. Обложка, пять спрайтов оружия и финал сгенерированы с подробным high-fidelity промптом; четыре иконки — с предметами из соответствующих спрайтов как строгими референсами. Обложка использует `arkady-cover.png`; финал — все три заданных референса.
- Сколько итераций и какие правки: по одной генеративной итерации на каждый из 11 ассетов. Банка и пустая рука сделаны правкой базовой бутылки; пробкомёт и пенная пушка используют бутылку как style lock; иконки используют свои спрайты оружия. После визуальной проверки выполнена одна техническая нормализация размеров и прозрачных полей. WebP оружия повторно упакованы с lossless alpha, чтобы нижний край сохранял alpha 255.
- Вывод скрипта проверки:

  ```text
  OK  cover-monsters (1920, 1080) 218 KB
  OK  finale-stella (1920, 1080) 180 KB
  OK  weapon-bottle (960, 800) 62 KB corners=[0, 0, 0] top=0 bottom=255
  OK  weapon-can (960, 800) 63 KB corners=[0, 0, 0] top=0 bottom=255
  OK  weapon-corker (960, 800) 82 KB corners=[0, 0, 0] top=0 bottom=255
  OK  weapon-foamer (960, 800) 105 KB corners=[0, 0, 0] top=0 bottom=255
  OK  weapon-hand-release (960, 800) 73 KB corners=[0, 0, 0] top=0
  OK  icon-bottle (256, 256) 11 KB corners=[0, 0, 0]
  OK  icon-can (256, 256) 13 KB corners=[0, 0, 0]
  OK  icon-corker (256, 256) 15 KB corners=[0, 0, 0]
  OK  icon-foamer (256, 256) 17 KB corners=[0, 0, 0]
  ```

- Что не получилось или выглядит спорно: точный `gpt-image-2.5-flare` / `gpt-image-2.5-sunburst` нельзя было выбрать через встроенный инструмент. Генератор выдал нестандартные исходные размеры, поэтому PNG были без искажения композиции приведены к размерам брифа. На обложке Солодовый король заметнее, чем остальные фигуры в тёмной зоне, но остаётся в дымке и не мешает площадке под заголовок. Надписи на оружии и иконках проверены визуально; при размере HUD 64 px мелкая надпись «ПРОБКОМЁТ» читается скорее как цветовая плашка, что ожидаемо для такого масштаба.
