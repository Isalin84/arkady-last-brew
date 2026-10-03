# Задание для Codex: нарисованные предметы и оборудование

Это задание на картинки. Код не трогай.

Нужно сгенерировать спрайты подбираемых предметов и цехового оборудования через встроенную генерацию изображений (GPT Image 2.5), проверить, сжать и разложить по путям ниже. Подключение в игру (`scene-art.js`, `renderer.js`, `game.js`, тесты, workflow) потом сделает Claude. Поэтому:

- JS, CSS, HTML, тесты и workflow не меняй.
- Ничего не коммить.
- В конце заполни раздел «Отчёт».

Принцип тот же, что у монстров в [codex-monsters-brief.md](codex-monsters-brief.md):

- плоская картинка на прозрачном фоне;
- вторые кадры и состояния делаются правкой первого кадра.

Летящие бутылку и банку рисовать не нужно: для них подойдут уже готовые иконки `icon-bottle` и `icon-can`.

## Как спрайт работает в игре

**Билборд.** Предмет — плоская картинка, всегда повёрнутая к игроку. Нужен вид спереди на уровне глаз, чуть сверху.

**Масштаб.** Картинку растягивают по высоте под размер предмета в мире. Нижний край (ножки, основание) — на линии **94% высоты кадра**.

**Прозрачность.** Рендер режет прозрачность по порогу 50%:

- никаких теней на полу;
- никакого полупрозрачного пара, стекла с просветом и свечения;
- стекло и пар рисуй плотными непрозрачными формами.

**Освещение.** Свет и туман игра накладывает сама, поэтому нужен ровный нейтральный свет спереди.

**Таблички.** На оборудовании есть таблички — по ним игрок ориентируется, особенно на пультах-заданиях. Табличка — это:

- тёмно-бирюзовая плашка `#102d38`;
- тонкая золотая рамка `#e0bd65`;
- кремовые заглавные буквы `#f4dfab`.

Текст строго как в задании. Других надписей нет.

**Скорость.** Скорость кадра это не затронет. Важен только вес, поэтому соблюдай лимиты.

## Референсы

| Файл | Роль |
|---|---|
| `assets/art/source/cover-monsters.png` | **Image 1 — стиль и материалы.** Медь, сталь, латунь, трубы, манометры пивоварни с обложки |
| `assets/art/source/ref-props/<имя>.png` | **Image 2 — дизайн.** Текущий игровой спрайт: что это, силуэт, цвета, где табличка. Экспорт 512×512 из игры |

Имена референсов совпадают с типом в игре. Отличаются только эти:

| Спрайт | Референс |
|---|---|
| `prop-bottle-line` | `bottles.png` |
| `prop-can-line` | `cans.png` |
| `prop-malt-silo` | `maltSilo.png` |
| `prop-bucket-elevator` | `bucket.png` |
| `prop-malt-bags` | `maltBags.png` |
| `item-mark` | `mark.png` |
| Остальные предметы | `item-<имя>.png` |
| Пульты | `<имя>-off.png` / `<имя>-on.png` |

## Общие правила

1. **Модель.** Разведка — `gpt-image-2.5-flare` с качеством `medium`. Финал — `gpt-image-2.5-sunburst` с качеством `high`. Если модель выбрать нельзя, пиши формат и прозрачный фон словами.
2. **Размер генерации.** `1024x1024`. Две конвейерные линии — `1632x960` (в игре они шире). Background `transparent`, output `png`.
3. **Порядок.**
   - Сначала все кадры A, затем общий просмотр: стиль должен быть единым.
   - Потом кадры `b` и состояния `on` правкой A.
   - Список Preserve повторяй целиком.
4. **Одна правка за итерацию.** Если кадр верен на 80%, правь его, а не генерируй заново.
5. **Оригиналы.** PNG сохраняй в `assets/art/source/props/`. WebP — в `assets/art/`.

### Style lock — вставляй дословно в каждый промпт кадра A

```text
Style lock: hand-painted semi-realistic prop art for a retro first-person shooter set in an old Soviet-era brewery, matching the copper, steel, brass and painted-metal materials in Image 1; straight front view at eye level, seen slightly from above; bold dark-brown outline around the silhouette; big readable shapes and strong value contrast that stay clear when shrunk to 64 px; even neutral front lighting with soft form shading; light wear, scratches and grime; isolated on a transparent background, clean hard alpha edges, no ground shadow, no background plate.
```

### Framing — вставляй дословно (кроме предметов со своей строкой Framing)

```text
Framing: the object stands centered; its feet or base touch a horizontal line at 94% of the frame height; it fills about 85% of the frame width; the top 3% of the frame stays empty.
```

### Шаблон кадра A

```text
Create a front-view sprite of <NAME> for a brewery first-person shooter, on a transparent background.

Image 1: style reference — match the painting style, outline and brewery materials of this key art.
Image 2: design reference — the current low-resolution game sprite; keep what the object is, its silhouette, main colors and where its label plate sits, and paint it with far more detail.

Subject: <SUBJECT>

<Style lock line>

<Framing line>

Use Case: billboard prop sprite in a raycaster game, seen from 40 to 300 px tall.

Constraints:
- Exactly one object, front view.
- Label plates are dark teal (#102d38) with a thin gold border (#e0bd65) and cream capitals (#f4dfab); their text is exactly as quoted and there is no other text.
- The background stays fully transparent with no shadow.
```

### Шаблон второго кадра или состояния (правка кадра A)

Image 1 = готовый кадр A этого предмета.

```text
Edit Image 1.

Change: <CHANGE>

Preserve: the object's design, materials, colors, proportions, outline style, overall size, center position, the base on the same line at 94% of the frame height, every label plate and its exact text, the lighting, the transparent background.

Constraints:
- Exactly one object, front view.
- No new text.
- No shadow, fully transparent background.
```

---

## Подбираемые предметы (WebP 256×256, не тяжелее 25 КБ)

### Аптечка — `item-health`

**NAME:** `"a first-aid kit"`

Свой Framing: `Framing: the object stands centered; its base touches a horizontal line at 94% of the frame height; it fills about 60% of the frame width.`

```text
Subject: a sturdy first-aid case of chipped cream enamel steel (#d9dab5) with a big green cross (#4f8a3c) on the front, brass corner caps, two brass latches and a worn leather carry handle on top.
```

### Ящик припасов — `item-ammo`

**NAME:** `"a supply crate"`

Свой Framing: `Framing: the object stands centered; its base touches a horizontal line at 94% of the frame height; it fills about 75% of the frame width.`

```text
Subject: an open wooden brewery crate packed with supplies: four green glass beer bottle necks with crown caps standing in a row, a dark stout can and a small canvas pouch of champagne corks tucked beside them; a cream paper label on the front reading "ХМЕЛЬНОЙ ДОЗОР" in dark green capitals.
```

Надпись здесь — исключение. Это не табличка, а кремовая бумажная этикетка с текстом «ХМЕЛЬНОЙ ДОЗОР» (Х-М-Е-Л-Ь-Н-О-Й Д-О-З-О-Р).

### Золотая пробка из тайника — `item-gold`

**NAME:** `"the golden crown cap — a secret-stash bonus"`

Свой Framing: `Framing: the object stands centered on its edge; its lowest point touches a horizontal line at 94% of the frame height; it fills about 65% of the frame width.`

```text
Subject: a giant polished gold beer bottle crown cap (#d4af37) standing upright on its crimped edge, with an embossed five-point star in the center and bright warm highlights along the crimps.
```

### Метка тайника на стене — `item-mark`

**NAME:** `"a brass secret-wall marker plate"`

Висит на стене в воздухе, поэтому линии пола нет. Свой Framing: `Framing: a square plate seen straight on, centered, filling 80% of the frame width and height.`

```text
Subject: a square scuffed brass plate (#c79a2e) with a raised rim, four round rivets in the corners and three diagonal gouged scratch marks across it, as if someone marked the wall.
```

---

## Оборудование (WebP 256×256, конвейеры 436×256; не тяжелее 30 КБ, конвейеры — 40 КБ)

Где есть второй кадр `b`, это анимация: в игре кадры A и B чередуются пять раз в секунду. Разница между ними должна быть маленькой.

### 01 Варочный цех

**ЦКТ — `prop-tank`.** NAME `"a cylindro-conical fermentation tank"`.

```text
Subject: a tall brushed-stainless fermentation tank on four short legs, domed top with a pipe rising up and bending right, a round pressure gauge on the right, a red valve wheel low on the left, two steel bands around the body, and a label plate across the middle reading "ЦКТ · 04".
```

**Сусловарочный котёл — `prop-kettle`.** NAME `"a copper wort kettle"`.

```text
Subject: a tall hammered-copper brew kettle on four short legs, domed copper top with a copper pipe rising and bending right, a pressure gauge on the right, a red valve wheel low on the left, two polished copper bands, and a label plate across the middle reading "СУСЛОВАРОЧНЫЙ".
```

**Фильтр-чан — `prop-filter`.** NAME `"a lauter filter tank"`.

```text
Subject: a squat wide stainless lauter tun with louvred filter slots across its front, a pipe rising up and bending right, a pressure gauge, a valve low on the left, and a label plate near the bottom reading "ФИЛЬТР-ЧАН".
```

**Бочка хмеля — `prop-keg`.** NAME `"a hop keg"`.

```text
Subject: a squat stainless steel keg on short legs with two raised rings and a sealed lid, a few green hop cones peeking from the top, and a label plate across the middle reading "ХМЕЛЬ".
```

### 02 Розлив и упаковка

**Конвейер с бутылками — `prop-bottle-line`, кадры `a`, `b`.** Размер `1632x960`. NAME `"a bottle conveyor line"`.

Свой Framing: `Framing: a wide landscape frame; the conveyor's legs touch a horizontal line at 94% of the frame height; it fills about 96% of the frame width.`

```text
Subject: a stretch of factory conveyor line seen from the front: a steel belt on rollers with a yellow-and-black hazard stripe along its front edge, four steel legs, and five green glass beer bottles with gold crown caps standing in a row on the belt, evenly spaced.
```

`b`: `Change: shift all five bottles 4% of the frame width to the right along the belt, as the next animation frame of the moving conveyor.`

**Конвейер с банками — `prop-can-line`, кадры `a`, `b`.** Размер `1632x960`.

Сделай правкой готового `prop-bottle-line-a`:

```text
Change: replace the five bottles with five silver beer cans with dark-red wraps standing in a row on the belt.
```

`b` — та же правка сдвига, что у бутылок, но правкой `prop-can-line-a`.

**Розливочный автомат — `prop-filler`, кадры `a`, `b`.** NAME `"a bottle filling machine"`.

```text
Subject: a boxy grey-blue filling machine with a large glass-fronted chamber where four filling nozzles hang above four green bottles, a small control column on the right with a green and an orange lamp, and a label plate at the bottom reading "РОЗЛИВ / СТЕКЛО".
```

`b`: `Change: the four filling nozzles are lowered onto the bottle necks, and the green lamp is lit brighter.`

**Закаточная машина — `prop-seamer`, кадры `a`, `b`.**

Сделай правкой готового `prop-filler-a`:

```text
Change: replace the four bottles with four silver beer cans under four flat seaming heads, and change the label plate text to "ЗАКАТКА / БАНКА".
```

`b` — правка `prop-seamer-a`: `Change: the four seaming heads are pressed down onto the can lids, and the green lamp is lit brighter.`

**Поддон с ящиками — `prop-pallet`.** NAME `"a stacked pallet"`.

```text
Subject: a wooden shipping pallet stacked with four cardboard beer cases in two rows, each case with a small dark label reading "№ 7", held by a strap.
```

**Рация — `prop-radio`, кадры `a`, `b`.** NAME `"a field radio on a desk"`.

```text
Subject: an old Soviet military field radio with an olive-green case, a small glowing green dial window, a few knobs and a tall whip antenna, standing on a small wooden desk with a label plate on its front reading "РАЦИЯ".
```

`b`: `Change: add three short solid curved signal arcs beside the antenna tip, in warm yellow (#deca78), as if the radio is transmitting.`

### 04 Солодовня

**Силос солода — `prop-malt-silo`.** NAME `"a malt silo"`.

```text
Subject: a tall stainless malt silo on legs with a domed top and a pipe leaving the top and bending right, a round gauge low on the right, two steel bands, and a label plate across the middle reading "СОЛОД · СИЛОС".
```

**Нория — `prop-bucket-elevator`, кадры `a`, `b`.** NAME `"a bucket elevator"`.

Свой Framing: `Framing: a tall narrow machine standing centered; its base touches a horizontal line at 94% of the frame height; it fills about 50% of the frame width; its top nearly touches the top edge.`

```text
Subject: a tall narrow grain bucket elevator: a steel frame with a yellow top cap, a vertical chain of small tin buckets full of golden malt visible through the open front, and a label plate across the middle reading "НОРИЯ".
```

`b`: `Change: move every bucket up by half a bucket's height along the chain, as the next animation frame.`

**Мешки солода — `prop-malt-bags`.** NAME `"a pile of malt sacks"`.

```text
Subject: a pyramid of five plump burlap sacks (#c8ab70) tied at the top, stacked on a low wooden pallet, each sack stencilled with "СОЛОД" in dark brown.
```

Надпись «СОЛОД» здесь — исключение: это трафарет на мешковине, а не табличка.

### 04 Солодовня — пульты-задания (два состояния)

`off` — задание не выполнено, `on` — выполнено. Свой Framing для всех трёх:

`Framing: a wall-standing control cabinet centered; its base touches a horizontal line at 94% of the frame height; it fills about 65% of the frame width.`

**Аспирация — `prop-aspiration-off`, `prop-aspiration-on`.** NAME `"an aspiration control cabinet"`.

```text
Subject: a dark teal-grey steel control cabinet with a small dark screen glowing dull red, a big round amber push button marked with a bold white letter "E", a row of vent slots below, and a label plate on top reading "АСПИРАЦИЯ".
```

`on`: `Change: the screen glows green, the push button turns bright green and its letter is replaced by a white check mark.`

**Шнек — `prop-screw-off`, `prop-screw-on`.**

Сделай правкой готового `prop-aspiration-off`:

```text
Change: change the label plate text to "ШНЕК · РЕВЕРС" and add a small reverse-arrow lever beside the button.
```

`on` — та же правка «Change: the screen glows green…», что у аспирации, но правкой `prop-screw-off`.

**Аварийный люк — `prop-hatch-off`, `prop-hatch-on`.** NAME `"an emergency hatch"`.

Свой Framing: `Framing: a heavy hatch in a wall frame, centered; its frame bottom touches a horizontal line at 94% of the frame height; it fills about 80% of the frame width.`

```text
Subject: a heavy round steel emergency hatch set in a dark steel wall frame, ringed with bolts, a red locking wheel in the center, and a label plate under it reading "АВАРИЙНЫЙ ЛЮК".
```

`on`: `Change: the hatch door swings open to the left, revealing a bright opening glowing soft green inside the frame, and the label plate text becomes "ЛЮК ОТКРЫТ".`

---

## Файлы

PNG — в `assets/art/source/props/<имя>.png`, WebP — в `assets/art/<имя>.webp`:

| Группа | Имена |
|---|---|
| Предметы | `item-health`, `item-ammo`, `item-gold`, `item-mark` |
| Варочный | `prop-tank`, `prop-kettle`, `prop-filter`, `prop-keg` |
| Розлив | `prop-bottle-line-a`, `prop-bottle-line-b`, `prop-can-line-a`, `prop-can-line-b`, `prop-filler-a`, `prop-filler-b`, `prop-seamer-a`, `prop-seamer-b`, `prop-pallet`, `prop-radio-a`, `prop-radio-b` |
| Солодовня | `prop-malt-silo`, `prop-bucket-elevator-a`, `prop-bucket-elevator-b`, `prop-malt-bags` |
| Пульты | `prop-aspiration-off`, `prop-aspiration-on`, `prop-screw-off`, `prop-screw-on`, `prop-hatch-off`, `prop-hatch-on` |

Итого 29 картинок.

## Сжатие

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter/assets/art"
for f in source/props/*.png; do n=$(basename "$f" .png)
 case $n in prop-bottle-line-*|prop-can-line-*) s="436 256";; *) s="256 256";; esac
 cwebp -q 84 -alpha_q 100 -exact -m 6 -resize $s "$f" -o "$n.webp"
done
```

Если файл тяжелее лимита, снижай `-q` шагами по 4, но не ниже 70.

## Проверка (обязательно перед отчётом)

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter" && python3 - <<'EOF'
from PIL import Image
import os
names='''item-health item-ammo item-gold item-mark prop-tank prop-kettle prop-filter prop-keg
prop-bottle-line-a prop-bottle-line-b prop-can-line-a prop-can-line-b prop-filler-a prop-filler-b prop-seamer-a prop-seamer-b
prop-pallet prop-radio-a prop-radio-b prop-malt-silo prop-bucket-elevator-a prop-bucket-elevator-b prop-malt-bags
prop-aspiration-off prop-aspiration-on prop-screw-off prop-screw-on prop-hatch-off prop-hatch-on'''.split()
for n in names:
    p=f'assets/art/{n}.webp'
    if not os.path.exists(p):print('MISSING',n);continue
    line='-line-' in n;size=(436,256) if line else (256,256);kb=25 if n.startswith('item') else 40 if line else 30
    im=Image.open(p).convert('RGBA');w,h=im.size;a=im.getchannel('A');k=os.path.getsize(p)//1024
    x0,y0,x1,y1=a.point(lambda v:255 if v>=128 else 0).getbbox() or (0,0,0,0)
    corners=max(a.getpixel(c) for c in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)])
    soft=sum(1 for v in a.getdata() if 24<v<232)/(w*h);feet=y1/h
    ok=im.size==size and k<=kb and corners==0 and soft<.05 and (n=='item-mark' or .88<=feet<=.97)
    print('OK ' if ok else 'FAIL',n,im.size,f'{k} KB',f'feet={feet:.2f}',f'soft={soft:.3f}')
EOF
```

Глазами проверь:

- надписи на табличках без ошибок, особенно «СУСЛОВАРОЧНЫЙ», «АСПИРАЦИЯ», «ШНЕК · РЕВЕРС», «АВАРИЙНЫЙ ЛЮК», «ЛЮК ОТКРЫТ»;
- кадры A и B различаются только движением;
- состояния `off` и `on` пультов легко различить издалека: красный против зелёного;
- нет теней и полупрозрачного пара.

## Отчёт (заполняет Codex)

### Модель и качество

Использована встроенная генерация `image_gen`, с `transparent_background: true` во всех 33 вызовах. Этот интерфейс не позволяет выбрать `gpt-image-2.5-flare` / `gpt-image-2.5-sunburst` и `medium` / `high`, поэтому конкретную модель и качество генерации подтвердить нельзя. Формат PNG, размеры и прозрачность указаны словами в промптах, как предусмотрено брифом.

Основные кадры использовали Image 1 = `cover-monsters.png`, Image 2 = соответствующий файл из `ref-props/`. Style lock, Framing и Subject взяты из этого брифа; отдельно указаны исключения для бумажной этикетки припасов, трафарета на мешках и буквы E на кнопке. Вторые кадры и состояния получены правкой своего основного кадра с полным списком Preserve.

Полные фактически отправленные промпты, включая четыре уточняющие правки, сохранены в [source/props/prompts.json](../assets/art/source/props/prompts.json).

### Итерации и правки

Подготовлены все 29 PNG и 29 WebP с точными именами из таблицы «Файлы».

- 17 самостоятельных основных изображений.
- 3 производных основных изображения: линия банок из линии бутылок, закаточная машина из розливочного автомата, пульт шнека из пульта аспирации.
- Общий просмотр всех 20 основных изображений до создания вторых кадров.
- 9 вторых кадров / состояний, каждый правкой соответствующего A или off.
- 4 дополнительные точечные правки: пять мешков вместо четырёх; три отчётливые царапины вместо двух; круглая средняя точка в «СОЛОД · СИЛОС»; короткие, полностью помещающиеся в кадре дуги сигнала рации.

Оригиналы встроенного генератора оставлены в его каталоге. Фактические размеры выбранных результатов: 25 изображений 1254×1254, три конвейера 1634×962, один конвейер 1635×962. В проекте PNG подготовлены на требуемых холстах 1024×1024 и 1632×960. Сохранён исходный альфа-канал; постобработка ограничена масштабированием и размещением на прозрачном холсте, без перерисовки материалов или букв.

Для связанных кадров использован единый масштаб и выравнивание по неподвижному основанию. Обычные основания расположены на 94% высоты, настенная метка центрирована и заканчивается на 90%. У открытого люка положение нижней таблички учитывается при выравнивании с закрытым состоянием. Пропорции объектов сохранены; узкие высокие конструкции могут занимать меньше указанной приблизительной ширины, чтобы не обрезать верх.

Сжатие: `cwebp -q 84 -alpha_q 100 -exact -m 6`, с размером 256×256 или 436×256. Все 29 файлов уложились в лимиты без снижения качества. Общий вес WebP — **443 030 байт (около 433 КиБ)**. Максимальные размеры: предметы 14 440 байт, обычное оборудование 19 140 байт, конвейеры 27 452 байта.

### Вывод скрипта проверки

Проверка из брифа выполнена на всех файлах. Дополнительно проверены точное множество 29 имён, 29 PNG-исходников, режим RGBA и размеры PNG, а также реальные байтовые лимиты без округления вниз до КБ. Максимальная доля полупрозрачных пикселей — 0,01744 (1,74%); углы всех изображений полностью прозрачны.

```text
OK  item-health (256, 256) 8 KB feet=0.94 soft=0.009
OK  item-ammo (256, 256) 13 KB feet=0.94 soft=0.009
OK  item-gold (256, 256) 11 KB feet=0.94 soft=0.007
OK  item-mark (256, 256) 14 KB feet=0.90 soft=0.011
OK  prop-tank (256, 256) 14 KB feet=0.94 soft=0.015
OK  prop-kettle (256, 256) 17 KB feet=0.94 soft=0.013
OK  prop-filter (256, 256) 18 KB feet=0.94 soft=0.014
OK  prop-keg (256, 256) 18 KB feet=0.94 soft=0.012
OK  prop-bottle-line-a (436, 256) 26 KB feet=0.94 soft=0.017
OK  prop-bottle-line-b (436, 256) 23 KB feet=0.94 soft=0.017
OK  prop-can-line-a (436, 256) 21 KB feet=0.94 soft=0.016
OK  prop-can-line-b (436, 256) 21 KB feet=0.94 soft=0.015
OK  prop-filler-a (256, 256) 16 KB feet=0.94 soft=0.010
OK  prop-filler-b (256, 256) 14 KB feet=0.94 soft=0.012
OK  prop-seamer-a (256, 256) 14 KB feet=0.94 soft=0.009
OK  prop-seamer-b (256, 256) 14 KB feet=0.94 soft=0.012
OK  prop-pallet (256, 256) 14 KB feet=0.94 soft=0.011
OK  prop-radio-a (256, 256) 13 KB feet=0.94 soft=0.013
OK  prop-radio-b (256, 256) 12 KB feet=0.94 soft=0.015
OK  prop-malt-silo (256, 256) 12 KB feet=0.94 soft=0.013
OK  prop-bucket-elevator-a (256, 256) 10 KB feet=0.94 soft=0.007
OK  prop-bucket-elevator-b (256, 256) 9 KB feet=0.94 soft=0.011
OK  prop-malt-bags (256, 256) 14 KB feet=0.94 soft=0.012
OK  prop-aspiration-off (256, 256) 11 KB feet=0.94 soft=0.010
OK  prop-aspiration-on (256, 256) 10 KB feet=0.94 soft=0.010
OK  prop-screw-off (256, 256) 10 KB feet=0.94 soft=0.010
OK  prop-screw-on (256, 256) 12 KB feet=0.94 soft=0.010
OK  prop-hatch-off (256, 256) 14 KB feet=0.94 soft=0.008
OK  prop-hatch-on (256, 256) 14 KB feet=0.94 soft=0.011
Assets: 29/29; PNG sources: 29/29; failures: 0
```

Глазами проверены исходники, общий набор основных кадров и все готовые пары WebP. Дополнительно просмотрены миниатюры высотой 64 пикселя с игровым порогом альфа 50%. Проверены все таблички, включая «СУСЛОВАРОЧНЫЙ», «АСПИРАЦИЯ», «ШНЕК · РЕВЕРС», «АВАРИЙНЫЙ ЛЮК» и «ЛЮК ОТКРЫТ». Состояния off/on различаются красным и зелёным экраном, кнопкой E / галочкой; люк открывается влево. Теней на полу, фоновых пластин и полупрозрачного пара нет.

### Что спорно или не получилось

- Встроенный генератор слегка перерисовывает фактуру между кадрами; это правки одного дизайна, но неподвижные части не побитово идентичны. При будущей интеграции стоит посмотреть анимацию при пяти переключениях в секунду. Геометрия, масштаб и основания проверены по парам.
- Сдвиги тары и ковшей визуально соответствуют небольшому движению из брифа, но генератор не гарантирует точность ровно 4% или половины высоты ковша до пикселя.
- На металле остались тёплые золотистые и отдельные холодные блики из стилевого референса, несмотря на запрос нейтрального фронтального света. Единство набора сохранено, направленных теней на полу нет.
- Исходные PNG и журнал промптов существуют локально; каталог `assets/art/source/` уже исключён текущим `.gitignore`. Это правило не менялось.

JS, CSS, HTML, тесты и workflow не изменялись. Имеющееся изменение `tasks/todo.md` не трогалось. Коммитов, подключения в игру и публикации не было, как требует бриф; файлы готовы для следующего этапа интеграции.
