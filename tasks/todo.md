# v1.0 — графика, оружие, враги, UX, реиграбельность

План: ~/.claude/plans/snoopy-snuggling-sparrow.md · ветка `v1.0-upgrade`

## Фаза 0 — каркас (opus)
- [x] settings.js, progression.js, renderer.js, fx.js, enemies.js, ui.js созданы; код вынесен из game.js без изменения поведения
- [x] хуки в game.js (loadLevel, tick, shoot, impact, hurtPlayer, interact, finish, render)
- [x] index.html, pages.yml (node --check + cp), package.json, загрузчик тестов
- [x] тест «каждый script src есть в pages.yml»
- [x] npm test + npm run test:browser зелёные, скриншот совпадает

## Фаза 1 — треки
- [x] 1A рендер: framebuffer, пол/потолок, туман, свет, спрайты, частицы, декали
- [x] 1C враги: stagger, knockback, полоски HP, плевун, босс «Солодовый король», фикс старта цеха 1
- [x] 1B оружие: тряска, hitstop, хит-маркер, бросок в 3 фазы, новая рука, роли оружия, апгрейды 1 из 3
- [x] 1E реиграбельность: комбо, тайники, медали, ветеран
- [x] 1D UX: fullscreen, пауза с настройками, сложность, HUD-слоты, мобайл-джойстик, арсенал

## Фаза 2 — интеграция и баланс
- [x] трупы/снаряды/свет в рендер, полоски из rects, правила сложности, v1.0

## Фаза 3 — README и ревью
- [x] README v1.0, финальное ревью

## Ревью

### Фаза 0
- Код вынесен в renderer/fx/enemies/ui/settings/progression; game.js держит глобальные обёртки (toast, updateHUD, damage, drawWorld, drawSprites, revealFinalScore) для тестов.
- `npm test` (4 файла) и `npm run test:browser` зелёные; новый tests/pages.test.cjs.
- Рендер 8 ракурсов попиксельно совпадает с HEAD (max diff 0). Сохранённые view0..7.png расходятся с HEAD в анимации спрайтов на 3 ракурсах, поэтому эталон снимался заново с HEAD.
- Собранный по шагам pages.yml `_site` запускается без ошибок в консоли.

### v1.0 (интеграция)
- Все 5 треков слиты в `v1.0-upgrade` через `--no-ff`. Конфликты были только в game.js (длинные строки loadLevel/tick/finish/render) и разрешены вручную.
- Шов оружие×враги: статусы (stagger/slow) убывали дважды. Теперь они живут только в enemies.js. Бутылка больше не получает гарантированный крит от собственного оглушения (`staggerBy`).
- Сложность применяется к боссу и клещам через `EnemyAI.make`. HUD учитывает `maxHp`.
- Рендер: частицы у камеры ограничены по размеру. Экран перехода очищает тосты, субтитр опущен под карточки.
- Проверено: `npm test` 10/10, `test:browser` 6/6, скриптовый прогон 4 цехов и босса без ошибок консоли, мобайл 844×390 и 390×844, сборка `_site` по pages.yml. Кадр 1.5 мс (medium) и 0.6 мс (low).
