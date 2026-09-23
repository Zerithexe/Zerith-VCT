"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],pad=n=>String(n).padStart(2,0),
esc=s=>String(s).replace(/[&<>"']/g,c=>"&#"+c.charCodeAt(0)+";"),dlg=$("#dlg"),
RG={AME:"Amerika",EMEA:"EMEA",PAC:"Pasifik",CN:"Çin"};

/* TAKIMLAR: id|ad|bölge|grup|renk. Logo için logos/ID.png dosyası ekle (ör. logos/T1.png) */
const T=Object.fromEntries(`T1|T1|PAC|A|#e2012d
100T|100 Thieves|AME|A|#ef4444
JDG|JD Gaming|CN|A|#f59e0b
FUT|FUT Esports|EMEA|A|#84cc16
GE|Global Esports|PAC|B|#fb923c
VIT|Team Vitality|EMEA|B|#facc15
LOUD|LOUD|AME|B|#22c55e
EDG|EDward Gaming|CN|B|#94a3b8
PRX|Paper Rex|PAC|C|#a855f7
TYL|TYLOO|CN|C|#3b82f6
G2|G2 Esports|AME|C|#64748b
TL|Team Liquid|EMEA|C|#0ea5e9
NS|Nongshim RedForce|PAC|D|#ef233c
KC|Karmine Corp|EMEA|D|#38bdf8
XLG|Xi Lai Gaming|CN|D|#06b6d4
NRG|NRG|AME|D|#f97316`.split("\n").map(l=>{const[id,n,r,g,c]=l.split("|");return[id,{id,n,r,g,c}]}));

/* KADROLAR: R.T1={c:"Koç adı",p:["oyuncu1","oyuncu2","oyuncu3","oyuncu4","oyuncu5"]} */
const R={};

/* MAÇLAR: id|A|B|başlangıç (UTC). Group D saatlerini resmi programdan teyit et. */
const M=`C1|TL|PRX|2026-09-24T09:00Z
C2|TYL|G2|2026-09-24T12:00Z
D1|KC|XLG|2026-09-25T09:00Z
D2|NS|NRG|2026-09-25T12:00Z
B1|GE|VIT|2026-09-26T09:00Z
B2|LOUD|EDG|2026-09-26T12:00Z
A1|100T|T1|2026-09-27T09:00Z
A2|JDG|FUT|2026-09-27T12:00Z`.split("\n").map(l=>{const[id,a,b,t]=l.split("|");return{id,a,b,t:+new Date(t),g:id[0],st:"up",sa:0,sb:0,ra:0,rb:0}});

const WATCH=[["Twitch","https://www.twitch.tv/valorant","Resmî ana yayın"],["YouTube","https://www.youtube.com/valorantesports/live","Resmî ana yayın"],["Kick","https://kick.com/valorant","Alternatif yayın"],["TikTok","https://www.tiktok.com/@valorantesports/live","Dikey mobil yayın"]];
const NEWS=[
["Turnuva","Champions Shanghai başlıyor","24 Eylül'den 18 Ekim'e kadar 16 takım 2,25 milyon dolarlık havuz için oynayacak. Şampiyon 1 milyon dolar alacak.","https://dotesports.com/valorant/news/vct-champions-2026-shanghai"],
["Gruplar","D Grubu en dikkat çekenlerden","Nongshim RedForce ilk turda son şampiyon NRG ile eşleşti. Karmine Corp ise Xi Lai Gaming'e karşı çıkacak.","https://www.hotspawn.com/valorant/news/valorant-champions-shanghai-group-draw"],
["Pasifik","Pasifik ilk Champions kupasının peşinde","Bölgenin Champions'taki en iyi sonucu bir ikincilik. Global Esports, Nongshim, Paper Rex ve T1 bu kez sahada.","https://www.invenglobal.com/articles/26442/riot-games-opens-valorant-champions-shanghai-on-september-24"],
["Haritalar","Abyss ve Summit rotasyonda","Abyss, Breeze'in yerini aldı. Summit ise Champions'ta ilk kez oynanacak.","https://valo2asia.com/news/valorant-champions-shanghai-everything-you-need-to-know"],
["Amerika","100 Thieves, LOUD'u beş haritada geçti","Amerika Stage 2 finali São Paulo'da beş harita sürdü. İki takım da Shanghai'a gidiyor.","https://www.hotspawn.com/valorant/news/valorant-champions-shanghai-group-draw"],
["Tarih","Franchise döneminin son Champions'ı","VCT 2027'de açık eleme sistemine dönüyor. Shanghai, bu düzenin son dünya şampiyonunu belirleyecek.","https://en.wikipedia.org/wiki/2026_Valorant_Champions"]];

/* Depolama ve oturum */
const LS=localStorage,SS=sessionStorage,jg=(k,d)=>{try{return JSON.parse(LS.getItem(k))||d}catch{return d}},js=(k,v)=>LS.setItem(k,JSON.stringify(v));
let me=LS.getItem("sw_me")||SS.getItem("sw_me"),P=jg("sw_p",{}),tab=null,last="";
if(me&&!jg("sw_u",{})[me])me=null;
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>pad(b.toString(16))).join("");

/* Puan: doğru kazanan 10, tam skor +5 */
const pt=(v,m)=>m.st!="done"?0:v[0]!=(m.sa>m.sb?"a":"b")?0:10+(v.slice(1)==Math.max(m.sa,m.sb)+""+Math.min(m.sa,m.sb)?5:0),
tot=k=>Object.entries(P[k]||{}).reduce((s,[id,v])=>s+pt(v,M.find(m=>m.id==id)||{}),0),
fmt=ms=>{let s=Math.max(0,ms/1e3|0);const d=s/86400|0;s%=86400;return(d?d+"g ":"")+pad(s/3600|0)+":"+pad(s/60%60|0)+":"+pad(s%60)},
fd=t=>new Date(t).toLocaleString("tr-TR",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}),
bd=(id,l)=>`<span class="bd${l?" l":""}" style="--c:${T[id].c}">${id}<img src="logos/${id}.png" alt="" onerror="this.remove()"></span>`;

function card(m){
 const a=T[m.a],b=T[m.b],go=Date.now()>=m.t,lock=go||m.st!="up",v=(P[me]||{})[m.id],
 lab=c=>(c[0]=="a"?a:b).id+" "+c[1]+"-"+c[2],
 s=m.st=="live"?`<span class="lv"><i></i>CANLI</span>`:m.st=="done"?"<b>Bitti</b>":go?"Başladı, skor bekleniyor":`Başlamasına <b data-t="${m.t}">${fmt(m.t-Date.now())}</b>`,
 sc=m.st=="up"?["–","–"]:[m.sa,m.sb],
 pk=!lock?(me?`<div class="pk">${["a20","a21","b21","b20"].map(c=>`<button data-m="${m.id}" data-v="${c}" class="${v==c?"on":""}">${lab(c)}</button>`).join("")}</div>`:`<p class="note"><a href="#" data-auth="l">Giriş yap</a> ve tahminini seç.</p>`):v?`<p class="note">Tahminin: <b>${lab(v)}</b>${m.st=="done"?` · <b>+${pt(v,m)}</b> puan`:""}</p>`:me?`<p class="note">Bu maça tahmin yapmadın.</p>`:"";
 return`<div class="card"><div class="top"><span>Grup ${m.g}, Bo3</span><span>${s}</span></div>
<div class="tm">${bd(m.a)}<span>${a.n}</span><span class="sc">${sc[0]}</span></div>
<div class="tm">${bd(m.b)}<span>${b.n}</span><span class="sc">${sc[1]}</span></div>
<p class="note">${m.st=="live"?`Harita ${m.sa+m.sb+1} · Raunt ${m.ra}–${m.rb}`:fd(m.t)}</p>${pk}</div>`}

function rm(){
 const f={live:M.filter(m=>m.st=="live"),up:M.filter(m=>m.st=="up"),done:M.filter(m=>m.st=="done")};
 if(!tab)tab=f.live.length?"live":"up";
 $$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.f==tab));
 $("#matches").innerHTML=f[tab].sort((x,y)=>x.t-y.t).map(card).join("")||`<p class="note">Bu sekmede maç yok.</p>`}

function rn(){
 const m=M.find(x=>x.st=="live")||M.filter(x=>x.st=="up").sort((x,y)=>x.t-y.t)[0];
 $("#next").innerHTML=m?`<span class="k">${m.st=="live"?"Şu an canlı":"Sıradaki maç"}</span>
<div class="vs">${bd(m.a)}${T[m.a].n}<span>vs</span>${T[m.b].n}${bd(m.b)}</div>
${m.st=="live"?`<span class="big">${m.sa}–${m.sb}</span>`:Date.now()>=m.t?`<span class="big">Başladı</span>`:`<span class="big" data-t="${m.t}">${fmt(m.t-Date.now())}</span>`}`:`<b>Grup aşaması tamamlandı</b>`}

const rme=()=>$("#me").innerHTML=me?`<span class="chip">${esc(jg("sw_u",{})[me].n)} · <b>${tot(me)}</b> puan</span><button class="btn gh" data-out>Çıkış</button>`:`<button class="btn gh" data-auth="l">Giriş yap</button><button class="btn" data-auth="r">Kayıt ol</button>`;

function rb(){
 const U=jg("sw_u",{}),r=Object.keys(U).map(k=>[k,U[k].n,tot(k)]).sort((a,b)=>b[2]-a[2]).slice(0,10);
 $("#board").innerHTML=r.length?`<table><tr><th>#</th><th>Oyuncu</th><th>Puan</th></tr>${r.map((x,i)=>`<tr class="${x[0]==me?"me":""}"><td>${i+1}</td><td>${esc(x[1])}</td><td>${x[2]}</td></tr>`).join("")}</table>`:`<p class="note">Henüz kimse yok. İlk kayıt olan sen ol.</p>`}

const sig=()=>me+JSON.stringify(M.map(m=>[m.st,m.sa,m.sb,m.ra,m.rb,Date.now()>=m.t]));
function dyn(){rn();rm();rme();rb();last=sig()}

function team(id){
 const t=T[id],r=R[id];
 dlg.innerHTML=`<div class="dl"><button class="x" data-x aria-label="Kapat">✕</button>${bd(id,1)}<h3>${t.n}</h3><p class="note">${RG[t.r]} · Grup ${t.g}</p>${r?`<p><b>Koç:</b> ${esc(r.c)}</p><ul>${r.p.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`:`<p class="note">Kadro ve koç bilgisi henüz eklenmedi. <code>script.js</code> içindeki <code>R</code> nesnesine ekleyebilirsin. <a target="_blank" rel="noopener" href="https://www.vlr.gg/search/?q=${encodeURIComponent(t.n)}">vlr.gg'de ara</a></p>`}</div>`;
 dlg.open||dlg.showModal()}

function auth(mode){
 const r=mode=="r",err=t=>$("#er").textContent=t;
 dlg.innerHTML=`<div class="dl"><button class="x" data-x aria-label="Kapat">✕</button><h3>${r?"Kayıt ol":"Giriş yap"}</h3>
<form id="af"><input name="u" placeholder="Kullanıcı adı" minlength="3" maxlength="16" required autocomplete="username"><input name="p" type="password" placeholder="Şifre (en az 6 karakter)" minlength="6" required autocomplete="${r?"new":"current"}-password">
<label class="ck"><input type="checkbox" name="k" checked> Beni hatırla</label><p class="er" id="er"></p><button class="btn">${r?"Hesap oluştur":"Giriş yap"}</button></form>
<p class="note">${r?`Hesabın var mı? <a href="#" data-auth="l">Giriş yap</a>`:`Hesabın yok mu? <a href="#" data-auth="r">Kayıt ol</a>`}</p></div>`;
 dlg.open||dlg.showModal();
 $("#af").onsubmit=async e=>{
  e.preventDefault();
  const f=new FormData(e.target),n=f.get("u").trim(),k=n.toLowerCase(),h=await sha(k+":"+f.get("p")),U=jg("sw_u",{});
  if(r){if(U[k])return err("Bu kullanıcı adı alınmış.");U[k]={n,h};js("sw_u",U)}
  else if(!U[k]||U[k].h!=h)return err("Kullanıcı adı veya şifre hatalı.");
  const keep=f.get("k");(keep?LS:SS).setItem("sw_me",k);(keep?SS:LS).removeItem("sw_me");
  me=k;dlg.close();dyn()}}

/* Sabit bölümler */
$("#groups").innerHTML=[..."ABCD"].map(g=>`<div class="card"><h3>Grup ${g}</h3>${Object.values(T).filter(t=>t.g==g).map(t=>`<div class="tm">${bd(t.id)}<span>${t.n}</span><small>${RG[t.r]}</small></div>`).join("")}</div>`).join("");
$("#teams").innerHTML=Object.values(T).map(t=>`<div class="card tc" data-team="${t.id}" tabindex="0">${bd(t.id,1)}<h3>${t.n}</h3><p class="note">${RG[t.r]} · Grup ${t.g}</p></div>`).join("");
$("#watch").innerHTML=WATCH.map(w=>`<a class="card" href="${w[1]}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><h3>${w[0]}</h3><p class="note">${w[2]}</p></a>`).join("");
$("#news").innerHTML=NEWS.map(n=>`<a class="card" href="${n[3]}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><p class="note" style="margin:0 0 6px">${n[0]}</p><h3>${n[1]}</h3><p class="note">${n[2]}</p></a>`).join("");

/* Etkileşim */
document.addEventListener("click",e=>{
 const q=s=>e.target.closest(s);let x;
 if(x=q("[data-auth]")){e.preventDefault();auth(x.dataset.auth)}
 else if(q("[data-out]")){LS.removeItem("sw_me");SS.removeItem("sw_me");me=null;dyn()}
 else if(x=q("[data-team]"))team(x.dataset.team)
 else if(x=q("[data-v]")){const m=M.find(k=>k.id==x.dataset.m);if(m&&m.st=="up"&&Date.now()<m.t){(P[me]=P[me]||{})[m.id]=x.dataset.v;js("sw_p",P);dyn()}}
 else if(x=q("#tabs button")){tab=x.dataset.f;rm()}
 else if(q("[data-x]")||e.target==dlg)dlg.close()});
document.addEventListener("keydown",e=>{if(e.key=="Enter"&&e.target.dataset.team)team(e.target.dataset.team)});
document.addEventListener("pointermove",e=>{
 document.documentElement.style.setProperty("--mx",e.clientX+"px");document.documentElement.style.setProperty("--my",e.clientY+"px");
 const c=e.target.closest?.(".card");if(c){const r=c.getBoundingClientRect();c.style.setProperty("--x",e.clientX-r.left+"px");c.style.setProperty("--y",e.clientY-r.top+"px")}});

/* Canlı veri: matches.json her 8 sn'de okunur. Örnek: [{"id":"C1","st":"live","sa":1,"sb":0,"ra":7,"rb":5}] (st: up|live|done) */
async function poll(){
 try{const r=await fetch("matches.json?"+Date.now(),{cache:"no-store"});if(!r.ok)return;
  (await r.json()).forEach(u=>{const m=M.find(x=>x.id==u.id);m&&["st","sa","sb","ra","rb"].forEach(k=>u[k]!=null&&(m[k]=u[k]))})}catch{}}
poll();setInterval(poll,8e3);

/* Deneme modu: adresin sonuna ?demo ekle. İlk maç 20 sn sonra başlar ve skor akar. */
if(/demo/.test(location.search)){
 const m=M[0];m.t=Date.now()+2e4;
 setInterval(()=>{if(Date.now()<m.t||m.st=="done")return;m.st="live";Math.random()<.5?m.ra++:m.rb++;
  if(m.ra>=13||m.rb>=13){m.ra>m.rb?m.sa++:m.sb++;m.ra=m.rb=0;if(m.sa==2||m.sb==2)m.st="done"}},2500)}

/* Saniyelik döngü */
setInterval(()=>{$$("[data-t]").forEach(e=>e.textContent=fmt(e.dataset.t-Date.now()));if(sig()!=last)dyn()},1e3);
dyn();
