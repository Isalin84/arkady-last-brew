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
console.log('PASS: '+scripts.length+' page scripts checked and deployed, '+tests.length+' node tests run in Pages workflow');
