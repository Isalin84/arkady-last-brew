# Задание для Codex: нарисованные спрайты монстров

Это задание на картинки. Код не трогай.

Нужно сгенерировать спрайты монстров через встроенную генерацию изображений (GPT Image 2.5), проверить их, сжать и разложить по путям ниже. Подключение в игру (`scene-art.js`, `renderer.js`, `enemies.js`, `game.js`, тесты, workflow) потом сделает Claude. Поэтому:

- JS, CSS, HTML, тесты и workflow не меняй.
- Ничего не коммить.
- В конце заполни раздел «Отчёт» внизу файла.

Принцип тот же, что у оружия в [codex-art-brief.md](codex-art-brief.md): нарисованная картинка на прозрачном фоне. Каждый следующий кадр монстра делается правкой первого, чтобы монстр не менялся между кадрами.

## Как спрайт работает в игре (важно для композиции)

**Билборд.** Монстр — плоская картинка, всегда повёрнутая к игроку. Поэтому:

- только вид спереди, монстр смотрит на зрителя;
- никаких ракурсов три четверти и вида сбоку.

**Масштаб.** Картинку растягивают по высоте под размер монстра в мире.

- Ноги (низ тела) всегда на линии **94% высоты кадра**, иначе монстр будет висеть над полом или тонуть в нём.
- Тело заполняет почти всю ширину кадра, как у текущих спрайтов.

**Прозрачность.** Рендер режет прозрачность по порогу 50%. Поэтому:

- полупрозрачные тени, дым и свечение исчезнут или станут рваными;
- нужны чёткие края и **никакой тени на полу**;
- «пыль» и «пар» рисуй плотными, непрозрачными формами.

**Освещение.** Свет, туман и белую вспышку попадания игра накладывает сама. Нужен ровный нейтральный свет спереди, без цветной контровой подсветки.

**Размер на экране.** Монстра видно от 40 до 300 пикселей по высоте. Нужны:

- крупные читаемые формы;
- контрастный силуэт;
- тёмная обводка.

Мелкие надписи не читаются, их не нужно.

**Скорость.** Скорость кадра это не затронет: рендер берёт пиксели с мип-уровней. Всё упирается в вес, поэтому соблюдай лимиты ниже.

## Референсы

| Файл | Роль |
|---|---|
| `assets/art/source/cover-monsters.png` | **Image 1 — стиль.** Так выглядят монстры на обложке. Дрожжи, пенная плесень, кисляк, плевун и Солодовый король должны совпасть с ней |
| `assets/art/source/ref-monsters/<slug>.png` | **Image 2 — дизайн.** Текущий игровой спрайт: кто это, силуэт, цвета, узнаваемые детали. Экспорт 512×512 из игры |

## Общие правила

1. **Модель.** Разведка — `gpt-image-2.5-flare` с качеством `medium`. Финал — `gpt-image-2.5-sunburst` с качеством `high`. Если модель выбрать нельзя, пиши формат и прозрачный фон словами, как в промптах.
2. **Размер генерации.** `1024x1024` (босс — `1664x1280`), background `transparent`, output `png`.
3. **Порядок.**
   - Сначала кадры **A** всех монстров, затем общий просмотр: стиль должен быть единым.
   - Только потом остальные кадры правкой A.
   - Список Preserve повторяй целиком в каждой правке.
4. **Одна правка за итерацию.** Если кадр верен на 80%, правь его, а не генерируй заново.
5. **Оригиналы.** PNG сохраняй в `assets/art/source/monsters/`. WebP — в `assets/art/` (папку без изменения workflow не создавай).

### Style lock — вставляй дословно в каждый промпт кадра A

```text
Style lock: hand-painted semi-realistic creature art for a retro first-person shooter, matching the monsters in Image 1; front view, the creature faces the viewer, full body; bold dark-brown outline around the silhouette; big readable shapes and strong value contrast that stay clear when shrunk to 64 px; even neutral front lighting with soft form shading; comedic-creepy brewery-monster look, PG; isolated on a transparent background, clean hard alpha edges, no ground shadow, no background plate.
```

### Framing — вставляй дословно (кроме монстров с отдельной строкой Framing)

```text
Framing: the creature stands centered; its feet or base touch a horizontal line at 94% of the frame height; its body fills about 90% of the frame width; the top 5% of the frame stays empty.
```

### Шаблон кадра A

Подставь `<NAME>`, `<SUBJECT>` и, если указано, свою строку Framing.

```text
Create a front-view sprite of <NAME>, a monster from a brewery first-person shooter, on a transparent background, square frame.

Image 1: style reference — match the painting style, outline, materials and comedic-creepy tone of the monsters in this key art.
Image 2: design reference — this is the current low-resolution game sprite; keep its identity, silhouette, main colors and signature details, and paint it with far more detail.

Subject: <SUBJECT>

<Style lock line>

<Framing line>

Use Case: billboard enemy sprite in a raycaster game, seen from 40 to 300 px tall.

Constraints:
- Exactly one creature.
- Front view only, facing the viewer.
- No text or letters anywhere.
- The background stays fully transparent with no shadow under the creature.
```

### Шаблон следующих кадров (правка кадра A)

Image 1 = готовый кадр A этого монстра.

```text
Edit Image 1.

Change: <CHANGE>

Preserve: the creature's design, colors, materials, proportions, outline style, overall size, center position, the feet on the same line at 94% of the frame height, the lighting, the transparent background.

Constraints:
- Exactly one creature.
- Front view, facing the viewer.
- No text, no shadow, fully transparent background.
```

---

## Монстры

**Стандартный кадр B.** Он же кадр атаки: в игре один и тот же кадр B используется и для шага, и для удара. Текст правки для B:

```text
Change: the attack pose — the creature lunges slightly toward the viewer, mouth opened wider showing more teeth, arms or limbs raised and spread, eyes narrowed in anger.
```

**WebP.**

- Обычные монстры: 256×256, не тяжелее 30 КБ.
- Босс: 416×320, не тяжелее 50 КБ.

### 0. Дикие дрожжи — slug `yeast`, кадры `a`, `b`

`<NAME>` = `"Wild Yeast"`

```text
Subject: a glossy lime-green (#b6c955) yeast colony blob the size of a dog, covered in budding round cells, with a cluster of small yellow eyes on top, two big angry eyes and a wide grin of sharp off-white teeth, short stubby legs, slime dripping from its chin.
```

### 1. Пенная плесень — slug `foam-mold`, кадры `a`, `b`

`<NAME>` = `"Foam Mold"`

```text
Subject: a hunched creature made of dripping beige beer foam (#d5a94d) with darker mold spots, a bent brass bottle crown cap stuck on its head like a hat, two angry dark eyes, a fanged mouth, foam arms that drip down to the floor.
```

### 2. Кисляк — slug `sour`, кадры `a`, `b`

`<NAME>` = `"Sourling"`

```text
Subject: a lanky purple (#c2b3d6) sour-mash imp with a round fermenting belly, two small curved horns, long thin arms with three-fingered hands, big mischievous eyes and a wide sly grin full of small teeth.
```

### 3. Баночный бес — slug `can-imp`, кадры `a`, `b`

`<NAME>` = `"Can Imp"`

```text
Subject: a possessed aluminium beer can monster: a dented silver can with a dark-red wrap, its torn-open lid bent up like two horns, angry yellow eyes and a jagged fanged mouth across the can body, thin metal arms with clawed hands, short legs.
```

### 4. Бутылочный кусач — slug `bottle-biter`, кадры `a`, `b`

`<NAME>` = `"Bottle Biter"`

```text
Subject: a green glass beer bottle monster with a round bulging belly, a gold crown cap on top, a huge fanged mouth with glass-shard teeth across the belly, red angry eyes, thin wiry green arms raised to grab.
```

### 5. Паллетный голем — slug `pallet-golem`, кадры `a`, `b`

`<NAME>` = `"Pallet Golem"`

```text
Subject: a hulking golem built from stacked wooden pallet planks held with steel straps, a yellow-and-black hazard-stripe plank across its head, glowing orange angry eyes, a dark mouth with splintered wood teeth, huge blocky fists made of plank ends.
```

### 6. Бешеный погрузчик — slug `forklift`, кадры `hunt`, `charge`, `recover`

`<NAME>` = `"Rabid Forklift"`

Кадр `hunt` делается по шаблону A, `charge` и `recover` — правкой `hunt`.

```text
Subject: a possessed yellow (#dca62c) warehouse forklift seen straight from the front: overhead safety cage, two steel forks low in front like a jaw, headlights as angry eyes, the radiator grille as a row of teeth, chunky black tyres, scratched paint and an orange beacon on the roof.
```

- `charge`: `Change: charging pose — headlights blazing white-hot, forks raised like an open jaw, the body leaning toward the viewer, small solid sparks flying from the tyres.`
- `recover`: `Change: dazed pose — headlights dim and crossed, forks drooping to the floor, the cage slightly tilted, a few solid cartoon stars circling above the roof.`

### 7. Ричтрак «Начальник склада» — slug `reach-truck`, кадры `hunt`, `charge`, `recover`

`<NAME>` = `"Reach Truck — the Warehouse Boss"`

Image 2 = `reach-truck-hunt.png`. Сделай правкой готового `forklift-hunt`, чтобы техника была в одном стиле:

```text
Change: turn it into an elite boss version — paint it red (#b94027) with orange (#f08b51) trim, a taller extended mast, a bigger rotating orange beacon, a crumpled manager's necktie hanging from the overhead guard, meaner narrow headlight eyes.
```

`charge` и `recover` — те же правки, что у погрузчика, но правкой `reach-truck-hunt`.

### 8. Солодовый клещ — slug `malt-tick`, кадры `a`, `b`

`<NAME>` = `"Malt Tick"`

Свой Framing: `Framing: the creature is centered and low; its legs touch a horizontal line at 94% of the frame height; its body with legs fills about 90% of the frame width; the top 20% of the frame stays empty.`

```text
Subject: a round tick made of a golden-brown malt grain husk (#d6a94f) with segmented shell lines, eight spiky jointed legs spread wide, small red eyes and a fanged mouth with two mandibles.
```

### 9. Пылевой призрак — slug `dust-ghost`, кадры `a`, `b`

`<NAME>` = `"Dust Ghost"`

```text
Subject: a ghost formed from a dense, solid cloud of grey-beige malt dust (#c7b99a) with clumpy billowing edges, angry glowing orange eyes, a dark fanged mouth, wispy clawed arms; the cloud is painted as solid opaque puffs, its bottom forming a thick swirl that touches the floor line.
```

### 10. Комовой страж — slug `clump-guard`, кадры `a`, `b`

`<NAME>` = `"Clump Guardian"`

```text
Subject: a squat heavy guardian made of a giant clod of caked brown malt (#9a713d), wrapped in torn burlap with a twisted straw band across its brow, angry orange eyes, a wide mouth with grain-kernel teeth, two thick lumpy arms.
```

### 11. Дрожжевой плевун — slug `spitter`, кадры `a`, `b`, `spit`

`<NAME>` = `"Yeast Spitter"`

Свой Framing: `Framing: the creature is centered; its base touches a horizontal line at 94% of the frame height; it fills about 70% of the frame width; the top 22% of the frame stays empty.`

```text
Subject: a bulbous pale-lime yeast creature (#c9dc5a) sitting on a puddle of its own slime, three yellow eyes in a row, a round sucker mouth ringed with tiny teeth, a swollen translucent throat sac glowing green, two short stubby arms.
```

- `b`: `Change: breathing pose — the body squashed 6% lower and 6% wider, the throat sac slightly smaller.`
- `spit`: `Change: spitting pose — the body puffed up taller, the throat sac fully inflated and glowing bright green, the sucker mouth stretched wide open with a glowing green glob inside it.` Для `spit` верх может доходить до 10% высоты кадра.

### 12. Солодовый король (босс) — slug `malt-king`

**Кадры:** `a`, `b`, `slam`, `rage-a`, `rage-b`, `rage-slam`.

**Генерация:** размер `1664x1280` (13:10 — в игре босс шире обычных). WebP 416×320.

`<NAME>` = `"the Malt King, final boss"`

Свой Framing: `Framing: the creature stands centered in a 13:10 landscape frame; its feet touch a horizontal line at 94% of the frame height; it fills about 85% of the frame width; the crown nearly touches the top edge.`

```text
Subject: the Malt King — a towering hulk built from packed malt grain and a bulging burlap sack body, golden (#d4af37) grain texture, a crown made of small copper brewing funnels on its head, two glowing amber eyes, a wide mouth with grain-kernel teeth, long arms with clawed hands, thick stumpy legs.
```

- `b`: `Change: the walking pose mirrored in weight — the other foot forward, arms swung the opposite way.`
- `slam`: `Change: ground-slam windup — both arms raised high overhead with fists clenched, mouth roaring wide open, the arms may reach the top edge of the frame.`
- `rage-a`, `rage-b`, `rage-slam`. Это правки `a`, `b` и `slam` соответственно, одной и той же строкой:

```text
Change: the enraged final phase — glowing red-orange cracks (#ff6a2a) split the grain body, the eyes burn red, the copper crown is dented, embers are painted as solid opaque sparks.
```

---

## Файлы

PNG-оригиналы — в `assets/art/source/monsters/<имя>.png`, WebP — в `assets/art/<имя>.webp`. Имена — строго по таблице:

| Тип | Кадры → имена файлов |
|---|---|
| 0 | `monster-yeast-a`, `monster-yeast-b` |
| 1 | `monster-foam-mold-a`, `monster-foam-mold-b` |
| 2 | `monster-sour-a`, `monster-sour-b` |
| 3 | `monster-can-imp-a`, `monster-can-imp-b` |
| 4 | `monster-bottle-biter-a`, `monster-bottle-biter-b` |
| 5 | `monster-pallet-golem-a`, `monster-pallet-golem-b` |
| 6 | `monster-forklift-hunt`, `monster-forklift-charge`, `monster-forklift-recover` |
| 7 | `monster-reach-truck-hunt`, `monster-reach-truck-charge`, `monster-reach-truck-recover` |
| 8 | `monster-malt-tick-a`, `monster-malt-tick-b` |
| 9 | `monster-dust-ghost-a`, `monster-dust-ghost-b` |
| 10 | `monster-clump-guard-a`, `monster-clump-guard-b` |
| 11 | `monster-spitter-a`, `monster-spitter-b`, `monster-spitter-spit` |
| 12 | `monster-malt-king-a`, `monster-malt-king-b`, `monster-malt-king-slam`, `monster-malt-king-rage-a`, `monster-malt-king-rage-b`, `monster-malt-king-rage-slam` |

Итого 33 картинки. Снаряд плевуна (зелёная капля) остаётся процедурным: он светится и мелкий.

## Сжатие

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter/assets/art"
for f in source/monsters/monster-*.png; do n=$(basename "$f" .png)
 case $n in monster-malt-king-*) s="416 320";; *) s="256 256";; esac
 cwebp -q 84 -alpha_q 100 -exact -m 6 -resize $s "$f" -o "$n.webp"
done
```

Если файл тяжелее лимита, снижай `-q` шагами по 4, но не ниже 70. Если и тогда не влезает — напиши об этом в отчёте.

## Проверка (обязательно перед отчётом)

```bash
cd "/Users/ivansalin/Documents/GitHub/3D Shooter" && python3 - <<'EOF'
from PIL import Image
import glob, os
files=sorted(glob.glob('assets/art/monster-*.webp'))
print(len(files),'files (expect 33)')
for p in files:
    n=os.path.basename(p)[:-5];boss=n.startswith('monster-malt-king');size=(416,320) if boss else (256,256);kb=50 if boss else 30
    im=Image.open(p).convert('RGBA');w,h=im.size;a=im.getchannel('A');k=os.path.getsize(p)//1024
    x0,y0,x1,y1=a.point(lambda v:255 if v>=128 else 0).getbbox() or (0,0,0,0)
    corners=max(a.getpixel(c) for c in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)])
    soft=sum(1 for v in a.getdata() if 24<v<232)/(w*h)
    feet=y1/h
    ok=im.size==size and k<=kb and corners==0 and .88<=feet<=.97 and soft<.05
    print('OK ' if ok else 'FAIL',n,im.size,f'{k} KB',f'feet={feet:.2f}',f'top={y0/h:.2f}',f'soft={soft:.3f}')
EOF
```

Что проверяет скрипт:

- **`feet`** — нижний край непрозрачной части. Должен быть между 0,88 и 0,97, то есть около линии 94%.
- **`soft`** — доля полупрозрачных пикселей. Если больше 5%, на картинке есть тень, дымка или свечение, которые в игре порвутся. Перерисуй плотнее.

Глазами проверь:

- монстры с обложки (дрожжи, пенная плесень, кисляк, плевун, король) узнаются;
- у каждого монстра все его кадры — одно и то же существо в том же месте кадра;
- вид везде спереди;
- надписей нет.

## Отчёт (заполняет Codex)

- Модель и качество: встроенный инструмент `image_gen` (режим imagegen skill, без CLI/API). В нём нет параметров выбора `gpt-image-2.5-flare` / `gpt-image-2.5-sunburst` и medium/high, поэтому конкретную модель и качество подтвердить нельзя. Формат PNG, требуемое соотношение сторон и полностью прозрачный фон указаны в промптах; `transparent_background: true` передан для каждого изображения.
- Итерации и правки по монстрам:
  - Сначала созданы 12 базовых кадров по шаблону A с обложкой как Image 1 и соответствующим игровым дизайном как Image 2. Style lock и Framing перенесены из задания дословно. Ричтрак hunt получен правкой готового forklift hunt с дополнительным референсом reach-truck-hunt.
  - Общий просмотр всех 13 базовых образов выполнен до генерации кадров атак.
  - Дрожжи, пенная плесень, баночный бес, бутылочный кусач, паллетный голем, солодовый клещ, пылевой призрак и комовой страж: один базовый кадр и одна правка A в B для каждого.
  - Кисляк: после первого A выполнена одна дополнительная правка силуэта — убраны дрожжевые глазки-почки и пена, оставлены два глаза, два изогнутых рога, круглый живот и длинные тонкие руки с трёхпалыми когтями. Затем B сделан правкой исправленного A.
  - Погрузчик: hunt и две отдельные правки hunt в charge/recover. Ричтрак: hunt правкой погрузчика, затем две отдельные правки собственного hunt.
  - Плевун: после первого A выполнена одна правка, выделяющая набухший горловой мешок под ртом. Затем две отдельные правки исправленного A в дыхание B и spit.
  - Солодовый король: A, правки A в B/slam; rage-a/rage-b/rage-slam сделаны отдельными правками соответствующих A/B/slam, с одинаковой строкой Change из брифа.
  - В каждой правке полный Preserve повторён. Всего 35 успешных генеративных результатов: 33 итоговых кадра и два заменённых варианта A.
  - Промпты базовых кадров и состояний взяты из разделов выше. Дополнительные правки A: Kislyak — “refine the body silhouette into a lanky sour-mash imp rather than a budding yeast blob. Remove the satellite budding eye-cells and beige foam”; Spitter — “make the swollen throat sac clearly visible … below the round sucker mouth … above the slime puddle”. В мешке прозрачность жидкости нарисована внутри формы; внешний alpha остаётся плотным.
  - Встроенный генератор вернул 27 квадратных PNG 1254×1254 и шесть кадров босса 1430×1100 / 1429×1100. Проектные PNG приведены к 1024×1024 и 1664×1280. Для каждого монстра применён один общий масштаб ко всем его позам, выравнивание центра и нижней границы непрозрачной части на 94% высоты. Анатомия и цвета программно не перерисовывались; исходный alpha сохранён при ресемплинге.
  - Все 33 проектных PNG находятся в `assets/art/source/monsters/`; все 33 WebP — непосредственно в `assets/art/`, имена совпадают с таблицей.
  - Сжатие: `cwebp -q 84 -alpha_q 100 -exact -m 6`, 256×256 / 416×320. Снижение качества не понадобилось. Общий размер WebP — 785 480 байт (около 767 КиБ); максимум обычного кадра — 30 208 байт, босса — 41 168 байт.
  - Проверены пары A/B, три состояния каждой машины, три состояния плевуна и шесть кадров босса рядом. Дополнительно просмотрены уменьшенные до 64 px варианты с отсечением alpha по 128, как в рендере. Монстры обращены к игроку; надписей и тени под ними нет.
- Вывод скрипта проверки:

```text
33 files (expect 33)
OK  monster-bottle-biter-a (256, 256) 22 KB feet=0.94 top=0.05 soft=0.023
OK  monster-bottle-biter-b (256, 256) 22 KB feet=0.94 top=0.05 soft=0.020
OK  monster-can-imp-a (256, 256) 19 KB feet=0.94 top=0.11 soft=0.019
OK  monster-can-imp-b (256, 256) 20 KB feet=0.94 top=0.09 soft=0.019
OK  monster-clump-guard-a (256, 256) 23 KB feet=0.94 top=0.13 soft=0.019
OK  monster-clump-guard-b (256, 256) 25 KB feet=0.94 top=0.10 soft=0.019
OK  monster-dust-ghost-a (256, 256) 22 KB feet=0.94 top=0.07 soft=0.033
OK  monster-dust-ghost-b (256, 256) 23 KB feet=0.94 top=0.07 soft=0.031
OK  monster-foam-mold-a (256, 256) 21 KB feet=0.94 top=0.17 soft=0.020
OK  monster-foam-mold-b (256, 256) 20 KB feet=0.94 top=0.17 soft=0.017
OK  monster-forklift-charge (256, 256) 29 KB feet=0.94 top=0.05 soft=0.029
OK  monster-forklift-hunt (256, 256) 19 KB feet=0.94 top=0.07 soft=0.014
OK  monster-forklift-recover (256, 256) 19 KB feet=0.94 top=0.05 soft=0.020
OK  monster-malt-king-a (416, 320) 38 KB feet=0.94 top=0.10 soft=0.013
OK  monster-malt-king-b (416, 320) 33 KB feet=0.94 top=0.10 soft=0.012
OK  monster-malt-king-rage-a (416, 320) 40 KB feet=0.94 top=0.10 soft=0.019
OK  monster-malt-king-rage-b (416, 320) 39 KB feet=0.94 top=0.10 soft=0.018
OK  monster-malt-king-rage-slam (416, 320) 36 KB feet=0.94 top=0.10 soft=0.017
OK  monster-malt-king-slam (416, 320) 32 KB feet=0.94 top=0.11 soft=0.012
OK  monster-malt-tick-a (256, 256) 14 KB feet=0.94 top=0.33 soft=0.016
OK  monster-malt-tick-b (256, 256) 18 KB feet=0.94 top=0.20 soft=0.019
OK  monster-pallet-golem-a (256, 256) 21 KB feet=0.94 top=0.20 soft=0.017
OK  monster-pallet-golem-b (256, 256) 22 KB feet=0.94 top=0.19 soft=0.016
OK  monster-reach-truck-charge (256, 256) 26 KB feet=0.94 top=0.08 soft=0.028
OK  monster-reach-truck-hunt (256, 256) 17 KB feet=0.94 top=0.05 soft=0.015
OK  monster-reach-truck-recover (256, 256) 19 KB feet=0.94 top=0.05 soft=0.020
OK  monster-sour-a (256, 256) 16 KB feet=0.94 top=0.08 soft=0.022
OK  monster-sour-b (256, 256) 17 KB feet=0.94 top=0.05 soft=0.022
OK  monster-spitter-a (256, 256) 10 KB feet=0.94 top=0.38 soft=0.008
OK  monster-spitter-b (256, 256) 10 KB feet=0.94 top=0.40 soft=0.009
OK  monster-spitter-spit (256, 256) 14 KB feet=0.94 top=0.25 soft=0.010
OK  monster-yeast-a (256, 256) 21 KB feet=0.94 top=0.07 soft=0.015
OK  monster-yeast-b (256, 256) 24 KB feet=0.94 top=0.07 soft=0.016
```

Дополнительно: проверены точные имена всех 33 файлов, наличие 33 PNG, RGBA и размеры исходников, а также строгие ограничения в байтах (не только округление КБ в основном скрипте). Все проверки PASS.

- Что спорно или не получилось:
  - Точный выбор запрошенных моделей/качества и размера непосредственно на этапе генерации недоступен; фактические ограничения и нормализация указаны выше.
  - Чтобы сохранить одинаковый масштаб босса во всех шести позах и не обрезать кулаки/искры, верхний запас в его итоговых кадрах около 10–11%, а не почти нулевой. Ноги во всех кадрах стоят на 94%.
  - У низких клеща и плевуна больше свободного пространства сверху; их ширина и общий масштаб фиксированы на всю серию. Горловой мешок плевуна заметно раздувается в spit.
  - На металле и мокрых материалах остаются небольшие тёплые блики, унаследованные от обложки; внешней цветной дымки, тени на полу и фоновой пластины нет.
  - Код, тесты, workflow и игровые подключения не изменялись; коммиты не создавались. Существовавшее изменение `tasks/todo.md` не затронуто.
