'use strict';
// Weapon base stats (ammo = starting supply), between-level upgrades and difficulty rules.
const WEAPON_BASE=[{name:'Смена №7 · IPA',ammo:Infinity,cool:.5,damage:42,speed:10,type:'bottle',count:1,spread:.1,life:2.5},{name:'Котёл 13 · стаут',ammo:18,cool:.8,damage:95,speed:7,type:'can',count:1,spread:.1,life:2.5},{name:'Пробкомёт',ammo:120,cool:.12,damage:19,speed:24,type:'cork',count:1,spread:.1,life:2.5},{name:'Пенная пушка',ammo:80,cool:.09,damage:11,speed:8,type:'foam',count:3,spread:.1,life:.65}];
// Upgrades picked between workshops: apply(weapons,run) edits the freshly rebuilt weapon stats (run.maxHp is the player's health cap).
const UPGRADES=[
 {id:'double_bottle',weapon:0,name:'Двойная бутылка',text:'Бутылка летит парой: две бутылки узким веером.',apply(w){w[0].count=2;w[0].spread=.07;}},
 {id:'shard_can',weapon:1,name:'Банка с осколками',text:'При взрыве банка разлетается на 4 осколка.',apply(w){w[1].split=4;}},
 {id:'pierce_cork',weapon:2,name:'Пробки навылет',text:'Пробка пробивает первого врага и летит дальше.',apply(w){w[2].pierce=1;}},
 {id:'wide_foam',weapon:3,name:'Широкий раструб',text:'Пять струй пены вместо трёх и дальше бьёт.',apply(w){w[3].count=5;w[3].life=.85;}},
 {id:'big_crate',weapon:1,name:'Крупная тара',text:'В ящиках на 50% больше банок.',apply(w){w[1].pick=1.5;}},
 {id:'quick_hand',weapon:-1,name:'Быстрая рука',text:'Всё оружие перезаряжается на 20% быстрее.',apply(w){for(const x of w)x.cool=Math.round(x.cool*800)/1000;}},
 {id:'sturdy',weapon:-1,name:'Крепкая спина',text:'+15 к максимуму здоровья и сразу +15 здоровья.',heal:15,apply(w,run){run.maxHp+=15;}},
 {id:'hop_charge',weapon:0,name:'Хмельной заряд',text:'20% бутылок бьют критом: двойной урон.',apply(w){w[0].crit=.2;}}
];
const DIFFICULTY={
 rookie:{enemyHp:.75,enemyDamage:.7,health:45,scoreMul:.6,lives:Infinity},
 normal:{enemyHp:1,enemyDamage:1,health:35,scoreMul:1,lives:Infinity},
 veteran:{enemyHp:1.4,enemyDamage:1.5,health:20,scoreMul:2,lives:1}
};
// Applies picked upgrades on top of freshly rebuilt weapon stats; returns the run-wide stats ({maxHp}).
function applyLoadout(weapons,upgrades){const run={maxHp:100};for(const id of upgrades||[])UPGRADES.find(u=>u.id===id)?.apply(weapons,run);return run;}
// n random upgrades the player does not own yet, as picker choices.
function rollUpgrades(n,owned=[]){const pool=UPGRADES.filter(u=>!owned.includes(u.id));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,n).map(({id,weapon,name,text})=>({id,weapon,name,text}));}
