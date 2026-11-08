import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import {SUPABASE_URL,SUPABASE_ANON_KEY} from "./config.js";
const $=s=>document.querySelector(s);
const ok=!SUPABASE_URL.includes("YOUR-PROJECT");
const sb=ok?createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
let user=null,name=null,view="leaderboard",signup=false;
const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");

async function loadUser(){
 if(!sb)return render();
 const {data:{session}}=await sb.auth.getSession();user=session?.user||null;name=null;
 if(user){const {data}=await sb.from("profiles").select("username").eq("id",user.id).maybeSingle();name=data?.username||null}
 render();
}
function render(){
 const a=$("#account");a.textContent="";
 if(user){const s=document.createElement("span");s.textContent="Connecté : "+(name||user.email);const b=document.createElement("button");b.textContent="Déconnexion";b.onclick=async()=>{await sb.auth.signOut();loadUser();loadBoard()};const pb=document.createElement("button");pb.textContent="Mon profil";pb.onclick=()=>openProfile(name);a.append(s,pb,b)}
 else{const b=document.createElement("button");b.textContent="Connexion / Inscription";b.onclick=()=>openAuth(false);a.append(b)}
}
let metric="seconds",days=null;
const LAB={seconds:"Temps",kills:"Kills",level:"Niveau"};
const dfmt=d=>new Date(d).toLocaleDateString("fr-BE");
function cell(tr,v){const td=document.createElement("td");td.textContent=v;tr.append(td);return td}
async function loadBoard(){
 const body=$("#rows"),msg=$("#boardmsg");body.textContent="";msg.textContent="";$("#vh").textContent=LAB[metric];
 if(!sb){msg.textContent="Classement indisponible : Supabase n’est pas encore configuré (voir README).";return}
 const {data,error}=await sb.rpc("get_leaderboard",{p_metric:metric,p_days:days});
 if(error){msg.textContent="Impossible de charger le classement.";return}
 if(!data.length)msg.textContent="Aucun score sur cette période. Sois le premier.";
 data.slice(0,15).forEach((r,i)=>{const tr=document.createElement("tr");if(r.username===name)tr.className="me";
  cell(tr,i+1);const td=cell(tr,"");const l=document.createElement("button");l.className="lnk";l.textContent=r.username;l.onclick=()=>openProfile(r.username);td.append(l);
  cell(tr,metric==="seconds"?fmt(r.seconds):r[metric]);body.append(tr)});
}
function sel(q,b){document.querySelectorAll(q).forEach(x=>x.classList.remove("on"));b.classList.add("on")}
document.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{sel("[data-m]",b);metric=b.dataset.m;loadBoard()});
document.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{sel("[data-d]",b);days=b.dataset.d?+b.dataset.d:null;loadBoard()});

// --- profil joueur
$("#pcl").onclick=()=>$("#prof").close();
async function openProfile(uname){
 const d=$("#prof"),c=$("#pc");c.textContent="Chargement…";if(!d.open)d.showModal();
 const {data:p}=await sb.from("profiles").select("id,created_at").eq("username",uname).maybeSingle();
 if(!p){c.textContent="Joueur introuvable.";return}
 const {data:runs}=await sb.from("runs").select("seconds,kills,level,created_at").eq("user_id",p.id).order("created_at",{ascending:false}).limit(200);
 c.textContent="";const h=document.createElement("h3");h.textContent=uname;
 const mx=k=>Math.max(0,...runs.map(r=>r[k]));
 const st=document.createElement("p");st.className="pst";
 st.textContent=runs.length+" parties · record "+fmt(mx("seconds"))+" · "+mx("kills")+" kills max · niveau max "+mx("level")+" · inscrit le "+dfmt(p.created_at);
 const t=document.createElement("table");t.innerHTML="<thead><tr><th>Date</th><th>Temps</th><th>Kills</th><th>Niv.</th></tr></thead>";
 const tb=document.createElement("tbody");runs.slice(0,20).forEach(r=>{const tr=document.createElement("tr");cell(tr,dfmt(r.created_at));cell(tr,fmt(r.seconds));cell(tr,r.kills);cell(tr,r.level);tb.append(tr)});
 t.append(tb);c.append(h,st,t);if(!runs.length)c.append("Aucune partie classée.");
}

// --- fenêtre de connexion
const dlg=$("#auth"),f=$("#af");
function openAuth(s){signup=s;$("#at").textContent=s?"Créer un compte":"Connexion";$("#ul").hidden=!s;$("#as").textContent=s?"S’inscrire":"Se connecter";$("#sw").textContent=s?"J’ai déjà un compte":"Créer un compte";$("#am").textContent="";f.p.autocomplete=s?"new-password":"current-password";if(!dlg.open)dlg.showModal()}
$("#sw").onclick=()=>openAuth(!signup);$("#ac").onclick=()=>dlg.close();
f.onsubmit=async ev=>{
 ev.preventDefault();const m=$("#am");
 if(!sb){m.textContent="Supabase n’est pas configuré (config.js).";return}
 const e=f.e.value.trim(),p=f.p.value,u=f.u.value.trim();
 if(p.length<8){m.textContent="Mot de passe trop court (8 min.).";return}
 m.textContent="…";
 if(signup){
  if(!/^[A-Za-z0-9_]{3,16}$/.test(u)){m.textContent="Pseudo invalide.";return}
  const {data:ex}=await sb.from("profiles").select("id").eq("username",u).maybeSingle();
  if(ex){m.textContent="Ce pseudo est déjà pris.";return}
  const {data,error}=await sb.auth.signUp({email:e,password:p,options:{data:{username:u}}});
  if(error){m.textContent=error.message;return}
  if(!data.session){m.textContent="Compte créé. Confirme ton e-mail puis connecte-toi.";return}
 }else{
  const {error}=await sb.auth.signInWithPassword({email:e,password:p});
  if(error){m.textContent="E-mail ou mot de passe incorrect.";return}
 }
 dlg.close();f.reset();await loadUser();loadBoard();
};

// --- liaison avec le jeu
window.onRunStart=()=>{if(sb&&user)sb.rpc("start_run").then(()=>{},()=>{})};
window.onRunEnd=async r=>{
 const p=document.createElement("p");p.style.marginTop="6px";$("#ui").append(p);
 if(!sb){p.textContent="Classement non configuré.";return}
 if(!user){p.textContent="Connecte-toi pour inscrire ton temps au classement.";const b=document.createElement("button");b.textContent="Connexion";b.onclick=()=>openAuth(false);$("#ui").append(b);return}
 if(r.seconds<5){p.textContent="Partie trop courte pour être classée.";return}
 p.textContent="Envoi du score…";
 const {error}=await sb.rpc("submit_run",{p_seconds:r.seconds,p_kills:r.kills,p_level:r.level});
 p.textContent=error?"Score refusé par le serveur ("+error.message+").":"Score enregistré.";
 loadBoard();
};
loadUser();loadBoard();
if(sb)sb.auth.onAuthStateChange(()=>loadUser());
