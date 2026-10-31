import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderMedia} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const work=path.join(root,'out/weekly-ten-render');
await mkdir(work,{recursive:true});
const readJson=async file=>JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
const manifest=await readJson(path.join(root,'public/weekly-ten/voiceover-manifest.json'));
const plan=await readJson(path.join(root,'effects/weekly-ten/storyboard.json'));
if(manifest.status!=='passed'||manifest.scenes.length!==12||plan.shots.length!==12)throw new Error('The final 12-scene weekly narration is required');
for(let i=0;i<12;i++){
 const s=manifest.scenes[i],p=plan.shots[i];
 if(s.id!==p.id||s.sceneDurationSeconds!==p.durationSeconds||s.captions.map(c=>c.text).join('')!==p.narration.join(''))throw new Error(`Stale narration at ${p.id}`);
 const audio=await readFile(path.join(root,'public/weekly-ten',s.file));
 if(createHash('sha256').update(audio).digest('hex')!==s.sha256)throw new Error(`Narration hash mismatch at ${s.id}`);
}
const sources=['effects/daily-ten/SceneFrame.tsx','effects/daily-ten/EditionContext.tsx','effects/daily-ten/PortraitScene.tsx','effects/daily-ten/NewsArt.tsx','effects/weekly-ten/storyboard.json','public/weekly-ten/voiceover-manifest.json','public/daily-ten/music.mp3','package-lock.json'];
for(const name of await readdir(path.join(root,'effects/weekly-ten')))if(name.endsWith('.tsx'))sources.push(`effects/weekly-ten/${name}`);
const fingerprint=createHash('sha256');
for(const file of sources.sort())fingerprint.update(file).update(await readFile(path.join(root,file)));
const inputHash=fingerprint.digest('hex');
const options={codec:'h264',videoBitrate:'10M',audioCodec:'aac',audioBitrate:'192k',sampleRate:48000,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:95,hardwareAcceleration:'required',concurrency:4};
const state={status:'running',startedAt:new Date().toISOString(),inputHash,options,platforms:[]};
const stateFile=path.join(work,'render-state.json');
const save=()=>writeFile(stateFile,JSON.stringify(state,null,2)+'\n');
let browser;
try{
 console.log('Bundling a fixed snapshot for both platform exports...');
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),outDir:path.join(work,'bundle'),rspack:true});
 browser=await openBrowser('chrome',{logLevel:'error'});
 const compositions=await getCompositions({serveUrl,inputProps:{},puppeteerInstance:browser});
 for(const target of [{id:'WeeklyTen-Bilibili',platform:'bilibili',width:1920,height:1080},{id:'WeeklyTen-Douyin',platform:'douyin',width:1080,height:1920}]){
  const composition=compositions.find(c=>c.id===target.id);
  if(!composition||composition.width!==target.width||composition.height!==target.height||composition.fps!==60||composition.durationInFrames!==10800)throw new Error(`Invalid composition ${target.id}`);
  const file=path.join(root,`out/weekly-ten-20261030-${target.platform}-1080p60.mp4`);
  const item={...target,file:path.relative(root,file),status:'rendering',startedAt:new Date().toISOString()};
  state.platforms.push(item);await save();
  let bucket=-1;
  await renderMedia({...options,composition,serveUrl,inputProps:{},outputLocation:file,puppeteerInstance:browser,logLevel:'error',onProgress:p=>{const next=Math.floor(p.renderedFrames/900);if(next!==bucket){bucket=next;console.log(`${target.platform}: ${p.renderedFrames}/10800 frames; encoded ${p.encodedFrames}`);}}});
  item.status='rendered';await save();
  console.log(`${target.platform}: checking streams and decoding the complete file...`);
  execFileSync(process.execPath,[path.join(root,'scripts/verify-export.mjs'),file,'180','60',String(target.width),String(target.height)],{stdio:'inherit',windowsHide:true});
  execFileSync(process.execPath,[path.join(root,'scripts/verify-weekly-ten-media.mjs'),file],{stdio:'inherit',windowsHide:true});
  item.status='passed';item.completedAt=new Date().toISOString();item.sizeBytes=(await stat(file)).size;await save();
 }
 state.status='passed';state.completedAt=new Date().toISOString();await save();console.log('Both complete 180-second MP4 exports passed verification.');
}catch(error){state.status='failed';state.error=error.stack??String(error);await save();throw error;}
finally{if(browser)await browser.close({silent:true});}
