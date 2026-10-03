'use strict';
// Combat feedback: particles, camera shake, hitstop and dynamic lights (hooks are filled by later tracks).
const GameFX=(()=>{
 const fx={particles:[],shake:{x:0,y:0},lights:[],decals:[],hitstop:0};
 // Extra billboards (corpses, thrown arcs, steam) handed to the renderer each frame.
 fx.sprites=()=>[];
 fx.burst=(x,y,color,n=14)=>{for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,s=Math.random()*1.8;fx.particles.push({x,y,dx:Math.cos(a)*s,dy:Math.sin(a)*s,z:Math.random()*.6,color,life:.35+Math.random()*.3});}};
 fx.reset=()=>{fx.particles=[];fx.lights=[];fx.decals=[];fx.shake.x=fx.shake.y=0;fx.hitstop=0;};
 fx.update=dt=>{fx.particles.forEach(p=>{p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;p.z-=dt*.4;});fx.particles=fx.particles.filter(p=>p.life>0);};
 fx.onShoot=weaponIndex=>{};
 fx.onHit=(enemy,amount)=>{};
 fx.onKill=enemy=>{};
 fx.onExplode=(x,y)=>{};
 fx.onHurt=amount=>{};
 return fx;
})();
