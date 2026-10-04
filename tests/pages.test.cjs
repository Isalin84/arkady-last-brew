const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
// GitHub Pages ships an explicit file list: every script the page loads must be syntax-checked and copied.
const html=readFileSync('index.html','utf8'),workflow=readFileSync('.github/workflows/pages.yml','utf8'),pkg=JSON.parse(readFileSync('package.json','utf8'));
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
assert.ok(scripts.includes('game.js')&&scripts.length>=10,'index.html scripts found: '+scripts);
const lines=workflow.split('\n').map(l=>l.trim());
const checked=new Set(lines.filter(l=>l.startsWith('node --check ')).map(l=>l.slice(13).trim()));
const copy=lines.find(l=>l.startsWith('cp index.html '));assert.ok(copy,'pages.yml copies index.html');
const copied=new Set(copy.split(/\s+/).slice(1,-1));
for(const src of scripts){
 assert.ok(checked.has(src),'pages.yml is missing: node --check '+src);
 assert.ok(copied.has(src),'pages.yml cp line is missing '+src);
}
assert.ok(copied.has('style.css'),'pages.yml copies style.css');
const tests=[...pkg.scripts.test.matchAll(/node\s+(tests\/\S+\.cjs)/g)].map(m=>m[1]);
assert.ok(tests.includes('tests/pages.test.cjs'),'package.json runs the pages test');
for(const file of tests)assert.ok(lines.includes('node '+file),'pages.yml does not run '+file);
assert.ok(lines.includes('npm run test:browser'),'pages.yml runs browser tests');
// Every streamed music file audio.js can request (both formats) is tracked and matched by a music cp glob; source MP3s never are.
const {execFileSync}=require('node:child_process'),audio=readFileSync('audio.js','utf8');
const tracks=[...audio.matchAll(/file:'([^']+)'/g)].map(m=>m[1]),exts=['webm','m4a'];
assert.ok(tracks.length>=4&&audio.includes("'assets/audio/music/'")&&exts.every(ext=>audio.includes("'"+ext+"'")),'music tracks found in audio.js: '+tracks);
const tracked=new Set(execFileSync('git',['ls-files','assets/audio/music'],{encoding:'utf8'}).split('\n').filter(Boolean));
const musicCopy=lines.find(l=>l.startsWith('cp ')&&l.endsWith('_site/assets/audio/music/'));assert.ok(musicCopy,'pages.yml copies music');
const globs=musicCopy.split(/\s+/).slice(1,-1).map(g=>new RegExp('^'+g.replace(/[.]/g,'\\.').replace(/\*/g,'[^/]*')+'$'));
const deployed=file=>globs.some(re=>re.test(file));
for(const name of tracks)for(const ext of exts){const file='assets/audio/music/'+name+'.'+ext;assert.ok(tracked.has(file),'music file is not in Git: '+file);assert.ok(deployed(file),'pages.yml does not copy '+file);}
for(const file of ['assets/audio/music/Arkady is  Back.mp3','assets/audio/music/arkady-hunting.mp3'])assert.ok(!deployed(file),'pages.yml must not publish MP3 sources: '+file);
// Every painted sprite and hall surface the art modules request is tracked and copied by the assets/art/*.webp glob.
const vm=require('node:vm'),requested=[];
const any=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:any,apply:()=>any,set:()=>true});// absorbs every Canvas call made while the art modules load
const sandbox={console,document:{createElement:()=>({getContext:()=>any})},Image:class{set src(v){requested.push(v);}addEventListener(){}}};vm.createContext(sandbox);
for(const file of ['weapons-art.js','scene-art.js'])vm.runInContext(readFileSync(file,'utf8')+';this.SceneArt=typeof SceneArt!=="undefined"?SceneArt:undefined;',sandbox);
sandbox.SceneArt.preload([0,1,2,3,4,5,6,7,8,9,10,11,12]);sandbox.SceneArt.preloadProps(['tank','kettle','filter','keg','bottles','cans','filler','seamer','radio','pallet','maltSilo','bucket','maltBags','aspiration','screw','hatch']);for(let hall=0;hall<4;hall++)sandbox.SceneArt.surfaces(hall);
const art=new Set(execFileSync('git',['ls-files','assets/art'],{encoding:'utf8'}).split('\n').filter(Boolean));
assert.ok(lines.includes('cp assets/art/*.webp _site/assets/art/'),'pages.yml copies assets/art/*.webp');
assert.ok(requested.length===109,'painted sprites and surfaces requested: '+requested.length);
for(const file of requested)assert.ok(/^assets\/art\/[^/]+\.webp$/.test(file)&&art.has(file),'painted art is not in Git or outside assets/art: '+file);
console.log('PASS: '+scripts.length+' page scripts checked and deployed, '+tests.length+' node tests run in Pages workflow, '+tracks.length*exts.length+' music files tracked and deployed, '+requested.length+' painted art files tracked');
