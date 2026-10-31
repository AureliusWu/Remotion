import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const plan=await read('effects/daily-ten/storyboard.json');
const voice=await read('public/daily-ten/voiceover-manifest.json');
assert.equal(plan.shots.length,12);
assert.equal(voice.status,'passed');
assert.equal(voice.scenes.length,12);
assert.equal(plan.shots.reduce((n,s)=>n+s.durationSeconds,0),180);
assert.equal(voice.totalSceneDurationSeconds,180);
const report={status:'passed',checkedAt:new Date().toISOString(),newsItems:10,timelineSeconds:180,frames:10800,scenes:[],captionCount:0};
let startFrame=0;
for(let i=0;i<plan.shots.length;i++){
  const shot=plan.shots[i],scene=voice.scenes[i];
  assert.equal(shot.id,scene.id);
  assert.equal(shot.durationSeconds,scene.sceneDurationSeconds);
  assert.equal(scene.captions.length,shot.narration.length);
  assert.deepEqual(scene.captions.map(c=>c.text),shot.narration);
  assert(scene.fromSeconds+scene.durationSeconds<=shot.durationSeconds-.15);
  const file=path.resolve(root,'public/daily-ten',scene.file);
  assert(file.startsWith(path.join(root,'public/daily-ten')+path.sep));
  const sha256=createHash('sha256').update(await readFile(file)).digest('hex');
  assert.equal(sha256,scene.sha256);
  let end=0;
  for(const c of scene.captions){assert(c.startSeconds>=end);assert(c.endSeconds>c.startSeconds);assert(c.endSeconds<=shot.durationSeconds);end=c.endSeconds;report.captionCount++;}
  if(i>0&&i<11){assert(shot.details.length===2);assert(shot.sourceLabel);assert(shot.publishedOn);assert(shot.eventOn);assert.equal(new URL(shot.sourceUrl).protocol,'https:');}
  report.scenes.push({id:shot.id,startFrame,endFrame:startFrame+shot.durationSeconds*60-1,narrationSha256:sha256});
  startFrame+=shot.durationSeconds*60;
}
assert.equal(startFrame,10800);
assert.equal(report.captionCount,24);
await mkdir(path.join(root,'out/daily-ten-audio'),{recursive:true});
await writeFile(path.join(root,'out/daily-ten-audio/content-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASSED: 10 sources, 12 exact scene windows, 24 verbatim timed captions, current narration hashes, 180 seconds.');
