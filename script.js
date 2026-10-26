(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('field'),ctx=canvas.getContext('2d');
const W=900,H=1200,ballStart={x:450,y:1025},goal={l:115,r:785,t:215,b:475};
// Transparent 3D-style sprite frames: same child in both national kits.
const sprites={};
for(const country of ['no','cd']) for(const pose of ['shooter_idle','shooter_kick','keeper_idle','keeper_left','keeper_right','keeper_high']){
 const img=new Image();img.src=`assets/${country}_${pose}.png`;sprites[`${country}_${pose}`]=img;
}

let team='no',attempts=0,goals=0,phase='ready',drag=null,shot=null,keeper=null,last=0,muted=false,raf=0,finishTimer=0;
const colors={no:{shirt:'#e52f36',trim:'#142b55',accent:'#fff',shorts:'#142b55'},cd:{shirt:'#1685f2',trim:'#f8d73e',accent:'#ec293a',shorts:'#1685f2'}};
function switchView(id){['menu','game','finish'].forEach(x=>$(x).hidden=x!==id)}
function audio(freq=440,dur=.12,type='sine',vol=.08){if(muted)return;try{const ac=audio.ac||(audio.ac=new (window.AudioContext||window.webkitAudioContext)());if(ac.state==='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime);g.gain.setValueAtTime(vol,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+dur);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+dur)}catch(e){}}
function cheer(){[480,620,790,980].forEach((f,i)=>setTimeout(()=>audio(f,.2,'triangle',.08),i*110))}
function start(){clearTimeout(finishTimer);attempts=0;goals=0;phase='ready';drag=null;shot=null;keeper=null;update();switchView('game');$('instruction').textContent='👆 Dra frå ballen og opp mot målet!';$('banner').className='';if(!raf)raf=requestAnimationFrame(loop)}
function update(){$('score').textContent=`⚽ ${goals} / ${attempts}  ·  ${5-attempts} igjen`;$('teams').textContent=team==='no'?'🇳🇴 Noreg mot 🇨🇩 Kongo':'🇨🇩 Kongo mot 🇳🇴 Noreg'}
function finish(){phase='done';$('finalScore').textContent=`${goals} av 5 mål!`;$('finalMessage').textContent=goals===5?'FANTASTISK! Du er STRAFFEKONGEN! 👑':goals>=3?'Kjempebra skote! ⚽':'Godt prøvd! Klar for ein ny runde?';switchView('finish')}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointerdown',e=>{if(phase!=='ready')return;const p=point(e);if(Math.hypot(p.x-ballStart.x,p.y-ballStart.y)>125)return;drag={x:p.x,y:p.y};canvas.setPointerCapture(e.pointerId);e.preventDefault()});
canvas.addEventListener('pointermove',e=>{if(!drag||phase!=='ready')return;drag=point(e);e.preventDefault()});
canvas.addEventListener('pointerup',e=>{if(!drag||phase!=='ready')return;const p=point(e),dx=p.x-ballStart.x,dy=p.y-ballStart.y;drag=null;if(dy>-65){$('instruction').textContent='Dra OPP frå ballen for å skyte!';return}const power=Math.min(1,Math.max(.22,Math.hypot(dx,dy)/640));const targetX=ballStart.x+dx*1.25;const targetY=goal.b-60-(Math.min(650,-dy)-80)*.47;const target={x:targetX,y:targetY};kick(target,power);e.preventDefault()});
canvas.addEventListener('pointercancel',()=>drag=null);
function kick(target,power){phase='flight';$('instruction').textContent='⚽ SKOOOT!';const miss=target.x<goal.l+15||target.x>goal.r-15||target.y<goal.t+10||target.y>goal.b-20;const accuracy=Math.max(0,1-Math.abs(target.x-450)/390);const saveChance=Math.min(.63,Math.max(.18,.47+accuracy*.12-power*.24));const save=!miss&&Math.random()<saveChance;
// Keeper reacts after the kick and moves toward a predicted landing zone.
const diveSide=save?Math.sign(target.x-450)||1:(Math.random()<.5?-1:1);
const keeperX=save?target.x+(Math.random()-.5)*35:450+diveSide*(145+Math.random()*110);
keeper={x:450,aimX:keeperX,lean:0,dive:0,side:diveSide};
shot={start:performance.now(),duration:680-power*170,target,power,miss,save,settled:false};audio(190,.15,'triangle',.14)}
function outcome(){if(!shot||shot.settled)return;shot.settled=true;attempts++;if(!shot.miss&&!shot.save){goals++;$('banner').textContent='⚽ MÅÅÅL!';cheer()}else if(shot.save){$('banner').textContent='🧤 REDNING!';audio(170,.3,'sawtooth',.07)}else{$('banner').textContent='😮 UTANFOR!';audio(130,.25,'triangle',.06)}$('banner').className='show';update();phase='result';finishTimer=setTimeout(()=>{if(attempts>=5){finish()}else{phase='ready';shot=null;keeper=null;$('banner').className='';$('instruction').textContent='👆 Dra frå ballen og opp mot målet!'}},1450)}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function line(x,y,xx,yy,width,color){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}
function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function field(){const sky=ctx.createLinearGradient(0,0,0,610);sky.addColorStop(0,'#4aa7e9');sky.addColorStop(.52,'#d3effe');sky.addColorStop(.53,'#19588b');sky.addColorStop(1,'#1b8343');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
// crowd and flags
for(let i=0;i<240;i++){const x=(i*79)%W,y=125+(i*47)%155;ellipse(x,y,4,4,['#ffe56c','#fff','#e13d48','#165fd2'][i%4])}
ctx.fillStyle='#166f37';ctx.fillRect(0,480,W,H-480);for(let i=0;i<9;i++){ctx.fillStyle=i%2?'#248d47':'#2d9d4d';ctx.fillRect(0,480+i*100,W,100)}
ctx.strokeStyle='#ffffff9a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,560);ctx.lineTo(W,560);ctx.moveTo(0,710);ctx.lineTo(900,710);ctx.moveTo(165,560);ctx.lineTo(30,1000);ctx.moveTo(735,560);ctx.lineTo(870,1000);ctx.stroke();
// goal interior
ctx.fillStyle='#143e4d';ctx.fillRect(goal.l,goal.t,goal.r-goal.l,goal.b-goal.t);ctx.strokeStyle='#ffffff62';ctx.lineWidth=2;for(let x=goal.l;x<=goal.r;x+=35)line(x,goal.t,x,goal.b,2,'#dffaff55');for(let y=goal.t;y<=goal.b;y+=28)line(goal.l,y,goal.r,y,2,'#dffaff55');line(goal.l,goal.b,goal.r,goal.b,14,'#dbefff');line(goal.l,goal.t,goal.r,goal.t,18,'white');line(goal.l,goal.t,goal.l,goal.b,17,'white');line(goal.r,goal.t,goal.r,goal.b,17,'white');ellipse(450,1018,92,23,'#102e224f')}
function person(x,y,scale,kit,mode,lean=0,pose='idle'){
 const key=`${kit}_${mode}_${pose}`;
 const img=sprites[key]||sprites[`${kit}_${mode}_idle`];
 if(!img||!img.complete||!img.naturalWidth)return;
 ctx.save();ctx.translate(x,y);
 // The sprite feet sit at y; sprites are image frames, not actual 3D models.
 const isDive=mode==='keeper'&&pose!=='idle';
 const h=(isDive?220:mode==='keeper'?245:235)*scale;
 const w=h*img.naturalWidth/img.naturalHeight;
 ellipse(0,3,Math.min(88,w*.35),11,'#082a2750');
 ctx.drawImage(img,-w/2,-h,w,h);
 ctx.restore();
}
function ball(x,y,r,spin=0){ctx.save();ctx.translate(x,y);ctx.rotate(spin);ellipse(0,0,r,r,'#fff');ctx.strokeStyle='#142035';ctx.lineWidth=Math.max(2,r*.06);ctx.stroke();ctx.fillStyle='#19263b';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(Math.cos(a)*r*.53,Math.sin(a)*r*.53,r*.17,r*.17,'#142035')}ellipse(0,0,r*.28,r*.28,'#142035');ctx.restore()}
function arrow(x1,y1,x2,y2){line(x1,y1,x2,y2,12,'#fff9');const a=Math.atan2(y2-y1,x2-x1);line(x2,y2,x2-35*Math.cos(a-.45),y2-35*Math.sin(a-.45),12,'#fff9');line(x2,y2,x2-35*Math.cos(a+.45),y2-35*Math.sin(a+.45),12,'#fff9')}
function draw(now){ctx.clearRect(0,0,W,H);field();let t=0;if(shot)t=Math.min(1,(now-shot.start)/shot.duration);const bob=Math.sin(now/280)*4;let kx=450,lean=0;if(keeper&&shot){const progress=Math.max(0,Math.min(1,(t-.17)/.68));const smooth=progress*progress*(3-2*progress);kx=450+(keeper.aimX-450)*smooth;lean=keeper.side*progress*.85}
const keeperKit=team==='no'?'cd':'no';
let keeperPose='idle';
if(shot&&t>.24){keeperPose=(shot.target.y<goal.t+95&&shot.save)?'high':keeper.side<0?'left':'right';}
// Keep the dive anchored near the goal mouth; sprites already show body tilt.
person(kx,463+bob*.3,keeperPose==='idle'?.85:1.05,keeperKit,'keeper',0,keeperPose);
if(phase==='ready'){person(310,1100,1.0,team,'shooter',0,'idle');ball(ballStart.x,ballStart.y,49,0);if(drag)arrow(ballStart.x,ballStart.y,drag.x,drag.y)}else if(shot){const u=Math.min(1,t);const x=ballStart.x+(shot.target.x-ballStart.x)*u;const y=ballStart.y+(shot.target.y-ballStart.y)*u-95*Math.sin(Math.PI*u);const r=49-(u*32);person(310,1100,1.0,team,'shooter',0,t<.23?'kick':'idle');if(!shot.settled||u<1){ball(x,y,r,u*9)}else if(shot.save){ball(kx+70,480,18,u*9)}else if(shot.miss){ball(Math.max(0,Math.min(W,shot.target.x)),shot.target.y,18,u*9)}else{ball(shot.target.x,shot.target.y,18,u*9)}if(u>=1&&!shot.settled)outcome()}}
function loop(now){last=now;if(!$('game').hidden)draw(now);raf=requestAnimationFrame(loop)}
document.querySelectorAll('.kit').forEach(btn=>btn.addEventListener('click',()=>{team=btn.dataset.team;document.querySelectorAll('.kit').forEach(b=>b.classList.toggle('selected',b===btn));audio(560,.08)}));$('start').addEventListener('click',start);$('again').addEventListener('click',start);$('reset').addEventListener('click',start);$('back').addEventListener('click',()=>{clearTimeout(finishTimer);phase='done';switchView('menu')});$('finishMenu').addEventListener('click',()=>{clearTimeout(finishTimer);phase='done';switchView('menu')});$('sound').addEventListener('click',()=>{muted=!muted;$('sound').textContent=muted?'🔇':'🔊'});
})();
