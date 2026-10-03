'use strict';
// Player preferences persisted per browser; modules subscribe with on(key,fn).
const GameSettings=(()=>{
 const KEY='arkady-settings-v1',DEFAULTS={sensitivity:1,quality:'auto',shake:true,showFps:false,difficulty:'normal'},listeners={};
 let values={...DEFAULTS};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')for(const k of Object.keys(DEFAULTS))if(k in saved&&typeof saved[k]===typeof DEFAULTS[k])values[k]=saved[k];}catch{}
 function get(key){return values[key];}
 function set(key,value){if(values[key]===value)return;values[key]=value;try{localStorage.setItem(KEY,JSON.stringify(values));}catch{}for(const fn of listeners[key]||[])try{fn(value,key);}catch(err){console.warn('Setting listener failed:',err.message);}}
 function on(key,fn){(listeners[key]||=[]).push(fn);return()=>{listeners[key]=listeners[key].filter(f=>f!==fn);};}
 function all(){return {...values};}
 return {get,set,on,all,DEFAULTS};
})();
