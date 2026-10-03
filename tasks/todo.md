# v1.0 — графика, оружие, враги, UX, реиграбельность

План: ~/.claude/plans/snoopy-snuggling-sparrow.md · ветка `v1.0-upgrade`

## Фаза 0 — каркас (opus)
- [x] settings.js, progression.js, renderer.js, fx.js, enemies.js, ui.js созданы; код вынесен из game.js без изменения поведения
- [x] хуки в game.js (loadLevel, tick, shoot, impact, hurtPlayer, interact, finish, render)
- [x] index.html, pages.yml (node --check + cp), package.json, загрузчик тестов
- [x] тест «каждый script src есть в pages.yml»
- [x] npm test + npm run test:browser зелёные, скриншот совпадает

## Фаза 1 — треки
- [ ] 1A рендер: framebuffer, пол/потолок, туман, свет, спрайты, частицы, декали
- [ ] 1C враги: stagger, knockback, полоски HP, плевун, босс «Солодовый король», фикс старта цеха 1
- [ ] 1B оружие: тряска, hitstop, хит-маркер, бросок в 3 фазы, новая рука, роли оружия, апгрейды 1 из 3
- [ ] 1E реиграбельность: комбо, тайники, медали, ветеран
- [ ] 1D UX: fullscreen, пауза с настройками, сложность, HUD-слоты, мобайл-джойстик, арсенал

## Фаза 2 — интеграция и баланс
- [ ] трупы/снаряды/свет в рендер, полоски из rects, правила сложности, v1.0

## Фаза 3 — README и ревью
- [ ] README v1.0, финальное ревью

## Ревью

### Фаза 0
- Код вынесен в renderer/fx/enemies/ui/settings/progression; game.js держит глобальные обёртки (toast, updateHUD, damage, drawWorld, drawSprites, revealFinalScore) для тестов.
- `npm test` (4 файла) и `npm run test:browser` зелёные; новый tests/pages.test.cjs.
- Рендер 8 ракурсов попиксельно совпадает с HEAD (max diff 0). Сохранённые view0..7.png расходятся с HEAD в анимации спрайтов на 3 ракурсах, поэтому эталон снимался заново с HEAD.
- Собранный по шагам pages.yml `_site` запускается без ошибок в консоли.
