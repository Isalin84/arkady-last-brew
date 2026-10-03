'use strict';
// Weapon base stats (ammo = starting supply), between-level upgrades and difficulty rules.
const WEAPON_BASE=[{name:'Смена №7 · IPA',ammo:Infinity,cool:.5,damage:42,speed:10,type:'bottle'},{name:'Котёл 13 · стаут',ammo:18,cool:.8,damage:95,speed:7,type:'can'},{name:'Пробкомёт',ammo:120,cool:.12,damage:19,speed:24,type:'cork'},{name:'Пенная пушка',ammo:80,cool:.09,damage:11,speed:8,type:'foam'}];
const UPGRADES=[];
const DIFFICULTY={
 rookie:{enemyHp:.75,enemyDamage:.7,health:45,scoreMul:.6,lives:Infinity},
 normal:{enemyHp:1,enemyDamage:1,health:35,scoreMul:1,lives:Infinity},
 veteran:{enemyHp:1.4,enemyDamage:1.5,health:20,scoreMul:2,lives:1}
};
// Applies picked upgrades on top of the current weapon stats (no upgrades exist yet).
function applyLoadout(weapons,upgrades){return weapons;}
