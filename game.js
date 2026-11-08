let AC=null,muted=false;try{muted=localStorage.getItem("neonmute")==="1"}catch(e){}
function tone(f,d,ty,v,sl){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=ty||"square";o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,sl),n+d);g.gain.setValueAtTime(v||.05,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(AC.destination);o.start(n);o.stop(n+d)}catch(e){}}
const SFX={shoot:()=>tone(660,.06,"square",.012,330),hit:()=>tone(180,.07,"sawtooth",.025,90),gem:()=>tone(880+Math.random()*200,.06,"triangle",.03),lvl:()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.15,"square",.05),i*80)),hurt:()=>tone(120,.25,"sawtooth",.07,40),dash:()=>tone(300,.15,"sine",.06,900),boss:()=>tone(80,.7,"sawtooth",.09,45),over:()=>[400,300,200,120].forEach((f,i)=>setTimeout(()=>tone(f,.25,"sawtooth",.06),i*160))};
const sl={};function play(k,gap){const n=performance.now();if(n-(sl[k]||0)<(gap||0))return;sl[k]=n;SFX[k]()}
let beatT=0,bi=0;function beat(dt){beatT-=dt;if(beatT<=0){beatT=Math.max(.2,.5-t/700);tone([55,55,65,49][bi++%4],.2,"triangle",.045)}}
const mb=document.getElementById("mute");function ml(){mb.textContent=muted?"Son : coupé":"Son : actif"}
mb.onclick=()=>{muted=!muted;try{localStorage.setItem("neonmute",muted?"1":"0")}catch(e){}ml()};ml();

const C=document.getElementById("c"),X=C.getContext("2d"),ui=document.getElementById("ui"),dashB=document.getElementById("dash");
const ST=document.getElementById("stage");let W,H,D=Math.min(devicePixelRatio||1,2);
function rs(){W=ST.clientWidth||300;H=ST.clientHeight||300;C.width=W*D;C.height=H*D;X.setTransform(D,0,0,D,0,0)}new ResizeObserver(rs).observe(ST);rs();
const R=(a,b)=>a+Math.random()*(b-a),TAU=Math.PI*2;
let S={coins:0,best:0,m:{hp:0,dmg:0,sp:0}};
try{const s=JSON.parse(localStorage.getItem("neon3")||"null");if(s)S=Object.assign(S,s)}catch(e){}
const save=()=>{try{localStorage.setItem("neon3",JSON.stringify(S))}catch(e){}};
const keys={};let joy=null,touch=false;
addEventListener("keydown",e=>{if(/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;if(e.key==="m"||e.key==="M")mb.click();keys[e.key.toLowerCase()]=1;if(e.key===" ")dash();if(lvlOpts&&"123".includes(e.key))pick(+e.key-1);e.preventDefault&&["arrowup","arrowdown"," "].includes(e.key.toLowerCase())&&e.preventDefault()});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=0);
C.addEventListener("pointerdown",e=>{joy={ox:e.clientX,oy:e.clientY,x:0,y:0};if(e.pointerType==="touch"){touch=true;dashB.style.display="block"}});
C.addEventListener("pointermove",e=>{if(!joy)return;let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy,l=Math.hypot(dx,dy);if(l>50){dx*=50/l;dy*=50/l}joy.x=dx/50;joy.y=dy/50});
addEventListener("pointerup",()=>joy=null);
dashB.addEventListener("pointerdown",e=>{e.stopPropagation();dash()});
let P,E,B,G,EB,Pt,Tx,t,kills,run=false,paused=false,shake=0,cam,fireT,pulseT,orbA,lvlOpts=null,bossT,spawnT,last=0;
const TY={
 s:{r:11,hp:8,sp:55,c:"#ff2d95",d:8,xp:1},
 f:{r:8,hp:4,sp:120,c:"#ffe600",d:6,xp:1},
 t:{r:20,hp:60,sp:34,c:"#b05cff",d:16,xp:4},
 g:{r:12,hp:10,sp:40,c:"#3dff8b",d:6,xp:2,shoot:1},
 b:{r:46,hp:700,sp:45,c:"#ff4d2e",d:25,xp:30,boss:1}
};
function reset(){
 const m=S.m;
 P={x:0,y:0,hp:100+m.hp*25,mhp:100+m.hp*25,sp:190*(1+m.sp*.07),dmg:10*(1+m.dmg*.12),rate:.6,multi:1,pierce:0,magnet:70,orbs:0,pulse:0,regen:0,xp:0,lv:1,next:5,dc:0,inv:0,dt:0,dx:0,dy:0,crit:.05};
 E=[];B=[];G=[];EB=[];Pt=[];Tx=[];t=0;kills=0;shake=0;cam={x:0,y:0};fireT=0;pulseT=3;orbA=0;bossT=60;spawnT=0;
}
const UP=[
 {n:"Tir rapide",d:"+20% cadence",f:()=>P.rate*=.8},
 {n:"Surcharge",d:"+25% dégâts",f:()=>P.dmg*=1.25},
 {n:"Tir multiple",d:"+1 projectile",f:()=>P.multi++,max:6,k:"multi"},
 {n:"Perforant",d:"Les tirs traversent +1 ennemi",f:()=>P.pierce++},
 {n:"Turbo",d:"+12% vitesse",f:()=>P.sp*=1.12},
 {n:"Aimant",d:"+50% portée de ramassage",f:()=>P.magnet*=1.5},
 {n:"Blindage",d:"+30 PV max et soin",f:()=>{P.mhp+=30;P.hp+=30}},
 {n:"Orbes",d:"+1 orbe tournant",f:()=>P.orbs++,max:7,k:"orbs"},
 {n:"Onde de choc",d:"Pulsation qui repousse et blesse",f:()=>P.pulse++,max:6,k:"pulse"},
 {n:"Régénération",d:"+1 PV/s",f:()=>P.regen++},
 {n:"Critique",d:"+10% chances de critique",f:()=>P.crit+=.1}
];
function lvlUp(){play("lvl");
 paused=true;
 let pool=UP.filter(u=>!u.max||P[u.k]<u.max).sort(()=>Math.random()-.5).slice(0,3);lvlOpts=pool;
 ui.className="";ui.innerHTML="<h1 style='font-size:2rem'>NIVEAU "+P.lv+"</h1><p>Choisis une amélioration (1, 2, 3 ou clic)</p><div class='row'>"+pool.map((u,i)=>"<button class='card' data-i='"+i+"'><b>"+(i+1)+". "+u.n+"</b><small>"+u.d+"</small></button>").join("")+"</div>";
 ui.querySelectorAll(".card").forEach(b=>b.onclick=()=>pick(+b.dataset.i));
}
function pick(i){if(!lvlOpts||!lvlOpts[i])return;lvlOpts[i].f();lvlOpts=null;ui.className="h";paused=false;P.inv=1;burst(P.x,P.y,"#00f0ff",24,200)}
function gainXp(n){P.xp+=n;while(P.xp>=P.next){P.xp-=P.next;P.lv++;P.next=Math.floor(P.next*1.35+3);lvlUp()}}
function dash(){if(!run||paused||P.dc>0)return;play("dash");P.dc=2;P.dt=.18;P.inv=.3;P.dx=P.lx||1;P.dy=P.ly||0;burst(P.x,P.y,"#fff",14,150)}
function burst(x,y,c,n,s){for(let i=0;i<n;i++){const a=R(0,TAU),v=R(.2,1)*s;Pt.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:R(.3,.8),c})}}
function spawn(type,ang){
 const a=ang!==undefined?ang:R(0,TAU),d=Math.max(W,H)*.65,T=TY[type],sc=1+t/60*.4;
 E.push({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d,t:T,hp:T.hp*sc,mh:T.hp*sc,cd:0,sh:R(1,3),kx:0,ky:0});
}
function hurt(n){if(P.inv>0)return;play("hurt");P.hp-=n;P.inv=.6;shake=10;burst(P.x,P.y,"#ff2d95",12,160);if(P.hp<=0)over()}
function dmgE(e,n,crit){play("hit",60);
 e.hp-=n;Tx.push({x:e.x,y:e.y-e.t.r,s:Math.round(n),l:.6,c:crit?"#ffe600":"#fff"});
 const dx=e.x-P.x,dy=e.y-P.y,l=Math.hypot(dx,dy)||1;if(!e.t.boss){e.kx+=dx/l*60;e.ky+=dy/l*60}
 if(e.hp<=0&&!e.dead){e.dead=1;kills++;burst(e.x,e.y,e.t.c,e.t.boss?60:10,e.t.boss?400:150);G.push({x:e.x,y:e.y,v:e.t.xp});if(e.t.boss){shake=25;for(let i=0;i<10;i++)G.push({x:e.x+R(-60,60),y:e.y+R(-60,60),v:5});P.hp=Math.min(P.mhp,P.hp+30)}}
}
function nearest(r){let b=null,bd=r*r;for(const e of E){const d=(e.x-P.x)**2+(e.y-P.y)**2;if(d<bd){bd=d;b=e}}return b}
function update(dt){
 t+=dt;beat(dt);
 // mouvement
 let mx=(keys.d||keys.arrowright?1:0)-(keys.q||keys.a||keys.arrowleft?1:0),my=(keys.s||keys.arrowdown?1:0)-(keys.z||keys.w||keys.arrowup?1:0);
 if(joy){mx+=joy.x;my+=joy.y}
 let l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
 if(l>.1){P.lx=mx/(l>1?1:l);P.ly=my/(l>1?1:l);const q=Math.hypot(P.lx,P.ly)||1;P.lx/=q;P.ly/=q}
 if(P.dt>0){P.dt-=dt;P.x+=P.dx*700*dt;P.y+=P.dy*700*dt;Pt.push({x:P.x,y:P.y,vx:0,vy:0,l:.3,c:"#00f0ff"})}
 else{P.x+=mx*P.sp*dt;P.y+=my*P.sp*dt}
 P.dc-=dt;P.inv-=dt;P.hp=Math.min(P.mhp,P.hp+P.regen*dt);
 cam.x+=(P.x-cam.x)*Math.min(1,dt*8);cam.y+=(P.y-cam.y)*Math.min(1,dt*8);
 // spawn
 spawnT-=dt;
 if(spawnT<=0){spawnT=Math.max(.12,.9-t/120);const n=1+Math.floor(t/45);
  for(let i=0;i<n;i++){const r=Math.random();spawn(t>20&&r<.2?"f":t>45&&r<.3?"t":t>30&&r<.45?"g":"s")}}
 if(t>=bossT){bossT+=60;play("boss");spawn("b");for(let i=0;i<12;i++)spawn("s",i/12*TAU)}
 // tir auto
 fireT-=dt;
 if(fireT<=0){const tg=nearest(520);if(tg){fireT=P.rate;play("shoot",70);const base=Math.atan2(tg.y-P.y,tg.x-P.x);
  for(let i=0;i<P.multi;i++){const a=base+(i-(P.multi-1)/2)*.16,cr=Math.random()<P.crit;B.push({x:P.x,y:P.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,l:1.2,p:P.pierce,d:P.dmg*(cr?2.5:1),cr,hit:new Set()})}}}
 // orbes
 orbA+=dt*3;
 for(let i=0;i<P.orbs;i++){const a=orbA+i/P.orbs*TAU,ox=P.x+Math.cos(a)*65,oy=P.y+Math.sin(a)*65;
  for(const e of E)if(!e.dead&&(e.x-ox)**2+(e.y-oy)**2<(e.t.r+9)**2&&(!e.oc||e.oc<=0)){e.oc=.35;dmgE(e,P.dmg*.8)}}
 // pulsation
 if(P.pulse>0){pulseT-=dt;if(pulseT<=0){pulseT=Math.max(1.6,4.5-P.pulse*.4);const rad=110+P.pulse*22;Pt.push({ring:1,x:P.x,y:P.y,r:0,mr:rad,l:.4,c:"#ff2d95"});for(const e of E)if((e.x-P.x)**2+(e.y-P.y)**2<rad*rad){dmgE(e,P.dmg*(1+P.pulse*.5))}}}
 // balles
 for(const b of B){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;
  for(const e of E)if(!e.dead&&!b.hit.has(e)&&(e.x-b.x)**2+(e.y-b.y)**2<(e.t.r+5)**2){b.hit.add(e);dmgE(e,b.d,b.cr);if(b.p--<=0){b.l=0;break}}}
 B=B.filter(b=>b.l>0);
 // ennemis
 for(const e of E){
  e.oc-=dt;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
  let sp=e.t.sp*(1+t/400);
  if(e.t.shoot&&d<280){sp=0;e.sh-=dt;if(e.sh<=0){e.sh=2;EB.push({x:e.x,y:e.y,vx:dx/d*170,vy:dy/d*170,l:4})}}
  e.x+=dx/d*sp*dt+e.kx*dt*6;e.y+=dy/d*sp*dt+e.ky*dt*6;e.kx*=.9;e.ky*=.9;
  if(d<e.t.r+12)hurt(e.t.d);
 }
 E=E.filter(e=>!e.dead);
 for(const b of EB){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;if((b.x-P.x)**2+(b.y-P.y)**2<150){b.l=0;hurt(8)}}
 EB=EB.filter(b=>b.l>0);
 // gemmes
 for(const g of G){const dx=P.x-g.x,dy=P.y-g.y,d=Math.hypot(dx,dy);if(d<P.magnet||g.m){g.m=1;g.x+=dx/d*420*dt;g.y+=dy/d*420*dt}if(d<14){g.c=1;play("gem",40);gainXp(g.v)}}
 G=G.filter(g=>!g.c);
 for(const p of Pt){p.l-=dt;if(p.ring){p.r=p.mr*(1-p.l/.4)}else{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.95;p.vy*=.95}}
 Pt=Pt.filter(p=>p.l>0);
 for(const q of Tx){q.l-=dt;q.y-=30*dt}Tx=Tx.filter(q=>q.l>0);
 shake*=.9;
 if(E.length>350)E.splice(0,E.length-350);
}
function glow(c,b){X.shadowColor=c;X.shadowBlur=b}
function draw(){
 X.fillStyle="#07070f";X.fillRect(0,0,W,H);
 const sx=R(-shake,shake),sy=R(-shake,shake);
 X.save();X.translate(W/2-cam.x+sx,H/2-cam.y+sy);
 // grille
 X.strokeStyle="rgba(0,240,255,.09)";X.lineWidth=1;X.beginPath();
 const gs=80,x0=Math.floor((cam.x-W/2)/gs)*gs,y0=Math.floor((cam.y-H/2)/gs)*gs;
 for(let x=x0;x<cam.x+W/2+gs;x+=gs){X.moveTo(x,y0);X.lineTo(x,y0+H+gs)}
 for(let y=y0;y<cam.y+H/2+gs;y+=gs){X.moveTo(x0,y);X.lineTo(x0+W+gs,y)}
 X.stroke();
 for(const g of G){glow("#3dff8b",8);X.fillStyle="#3dff8b";X.fillRect(g.x-3,g.y-3,6,6)}
 glow("#ffe600",10);
 for(const b of B){X.fillStyle=b.cr?"#ffe600":"#00f0ff";glow(X.fillStyle,10);X.beginPath();X.arc(b.x,b.y,b.cr?5:4,0,TAU);X.fill()}
 for(const b of EB){glow("#3dff8b",10);X.fillStyle="#3dff8b";X.beginPath();X.arc(b.x,b.y,5,0,TAU);X.fill()}
 for(const e of E){glow(e.t.c,12);X.fillStyle=e.t.c;X.beginPath();
  const n=e.t.boss?8:e.t.shoot?4:e.t.r>15?6:3;
  for(let i=0;i<n;i++){const a=i/n*TAU+(t*(e.t.boss?1:0));X.lineTo(e.x+Math.cos(a)*e.t.r,e.y+Math.sin(a)*e.t.r)}X.closePath();X.fill();
  if(e.t.boss||e.hp<e.mh){glow(0,0);X.fillStyle="#000";X.fillRect(e.x-e.t.r,e.y-e.t.r-8,e.t.r*2,4);X.fillStyle="#fff";X.fillRect(e.x-e.t.r,e.y-e.t.r-8,e.t.r*2*Math.max(0,e.hp/e.mh),4)}}
 for(let i=0;i<P.orbs;i++){const a=orbA+i/P.orbs*TAU;glow("#ff2d95",14);X.fillStyle="#ff2d95";X.beginPath();X.arc(P.x+Math.cos(a)*65,P.y+Math.sin(a)*65,9,0,TAU);X.fill()}
 // joueur
 if(P.inv<=0||Math.floor(t*20)%2){glow("#00f0ff",20);X.fillStyle="#e8f6ff";X.beginPath();X.arc(P.x,P.y,12,0,TAU);X.fill();X.strokeStyle="#00f0ff";X.lineWidth=3;X.stroke()}
 X.globalCompositeOperation="lighter";
 for(const p of Pt){X.globalAlpha=Math.max(0,p.l*1.5);if(p.ring){X.strokeStyle=p.c;X.lineWidth=4;X.beginPath();X.arc(p.x,p.y,p.r,0,TAU);X.stroke()}else{X.fillStyle=p.c;X.fillRect(p.x-2,p.y-2,4,4)}}
 X.globalAlpha=1;X.globalCompositeOperation="source-over";glow(0,0);
 X.font="bold 14px system-ui";X.textAlign="center";
 for(const q of Tx){X.fillStyle=q.c;X.globalAlpha=q.l*1.6;X.fillText(q.s,q.x,q.y)}X.globalAlpha=1;
 X.restore();
 // HUD
 X.fillStyle="#1a1a2e";X.fillRect(0,0,W,10);X.fillStyle="#3dff8b";X.fillRect(0,0,W*P.xp/P.next,10);
 const bw=Math.min(240,W-120);X.fillStyle="#1a1a2e";X.fillRect(12,22,bw,14);X.fillStyle=P.hp<P.mhp*.3?"#ff2d95":"#00f0ff";X.fillRect(12,22,bw*Math.max(0,P.hp)/P.mhp,14);
 X.fillStyle="#e8f6ff";X.font="bold 15px system-ui";X.textAlign="left";X.fillText("Niv. "+P.lv+"  ·  "+kills+" kills",12,56);
 X.textAlign="right";const m=Math.floor(t/60),s=Math.floor(t%60);X.font="bold 22px system-ui";X.fillText(m+":"+String(s).padStart(2,"0"),W-14,34);
 X.font="12px system-ui";X.fillStyle="#9fb4c8";X.fillText(P.dc>0?"Dash "+P.dc.toFixed(1)+"s":"Dash prêt (Espace)",W-14,52);
 const bl=bossT-t;if(bl<8&&bl>0){X.textAlign="center";X.fillStyle="#ff4d2e";X.font="bold 20px system-ui";X.fillText("BOSS dans "+Math.ceil(bl)+"s",W/2,50)}
}
function over(){play("over");
 run=false;const score=Math.floor(t);const earn=Math.floor(kills/4+t/8);S.coins+=earn;const nb=score>S.best;if(nb)S.best=score;save();
 setTimeout(()=>{ui.className="";ui.innerHTML="<h1>GAME OVER</h1><p>Survie : <b>"+fmt(score)+"</b>"+(nb?" — nouveau record perso !":"")+"<br>"+kills+" ennemis détruits · niveau "+P.lv+"<br>+"+earn+" pièces gagnées</p><button class='big' id='go'>Rejouer</button><button id='mn'>Menu</button>";
  document.getElementById("go").onclick=start;document.getElementById("mn").onclick=menu;window.onRunEnd&&window.onRunEnd({seconds:score,kills,level:P.lv,newBest:nb})},700);
}
const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
const MU=[{k:"hp",n:"Cœur d’acier",d:"+25 PV de départ"},{k:"dmg",n:"Noyau instable",d:"+12% dégâts"},{k:"sp",n:"Jambes cybernétiques",d:"+7% vitesse"}];
function menu(){
 ui.className="";
 ui.innerHTML="<h1>NÉON SURVIVORS</h1><p>Survis à la horde. Ton vaisseau tire tout seul : déplace-toi (ZQSD / WASD / flèches ou glisse au doigt), esquive avec Espace, ramasse l’XP verte et bâtis ton build. Un boss arrive chaque minute.</p><p>Record : <b>"+fmt(S.best)+"</b> · Pièces : <b>"+S.coins+"</b></p><button class='big' id='go'>JOUER</button><p style='margin-top:8px'>Améliorations permanentes</p><div class='row'>"+MU.map(u=>{const lv=S.m[u.k],c=10*(lv+1)*(lv+1);return"<button class='card' data-k='"+u.k+"' "+(S.coins<c||lv>=10?"disabled":"")+"><b>"+u.n+" ("+lv+"/10)</b><small>"+u.d+"<br>"+(lv>=10?"MAX":"Coût : "+c+" pièces")+"</small></button>"}).join("")+"</div>";
 document.getElementById("go").onclick=start;
 ui.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k,lv=S.m[k],c=10*(lv+1)*(lv+1);if(S.coins>=c){S.coins-=c;S.m[k]++;save();menu()}});
}
function start(){window.onRunStart&&window.onRunStart();reset();ui.className="h";run=true;paused=false;lvlOpts=null}
function loop(ts){
 const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
 if(P){if(run&&!paused)update(dt);draw()}
 requestAnimationFrame(loop);
}
reset();menu();requestAnimationFrame(loop);
