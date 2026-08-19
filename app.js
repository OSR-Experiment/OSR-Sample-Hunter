const $=id=>document.getElementById(id);
let state={pack:JSON.parse(localStorage.getItem("osrMyPack")||"[]")};
let currentItems=[];

document.addEventListener("DOMContentLoaded",()=>{
 $("hunt").addEventListener("click",hunt);
 $("viewPack").addEventListener("click",()=>$("packDrawer").classList.remove("hidden"));
 $("closePack").addEventListener("click",()=>$("packDrawer").classList.add("hidden"));
 $("addSelected").addEventListener("click",addSelected);
 $("exportPack").addEventListener("click",exportPack);
 renderPack();
});

async function hunt(){
 const q=$("query").value.trim();
 if(!q){$("status").textContent="Tell the hunter what vocal you're looking for.";return}
 $("hunt").disabled=true;$("pack").classList.add("hidden");$("strategy").classList.add("hidden");$("totem").classList.remove("hidden");$("status").textContent="";
 const texts=["turning your idea into a hunt","looking for real voices","checking recent uploads","digging through older recordings","rejecting obvious AI","building a sample shortlist"];
 let n=0;const timer=setInterval(()=>{$("totemText").textContent=texts[n++%texts.length]},650);
 try{
  const r=await fetch("/api/vocal-hunt?q="+encodeURIComponent(q),{headers:{"Accept":"application/json"}});
  const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{throw Error("The hunt API did not return JSON.")}
  if(!r.ok)throw Error(d.error||`API error ${r.status}`);
  currentItems=(d.items||[]).map((x,i)=>({...x,sampleId:x.id+"-"+i,selected:false}));
  $("strategyTags").innerHTML=(d.strategy||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("");
  $("strategy").classList.remove("hidden");
  renderSamplePack(currentItems,q);
  $("status").textContent=`${currentItems.length} candidate sources.`;
 }catch(e){console.error(e);$("status").textContent=e.message}
 finally{clearInterval(timer);$("totem").classList.add("hidden");$("hunt").disabled=false}
}

function renderSamplePack(items,q){
 $("packTitle").textContent=(q.toUpperCase()+" VOCALS").slice(0,52);
 $("packMeta").textContent=`${items.length} candidate sources · segments will be extracted by the audio worker`;
 const box=$("samples");box.innerHTML="";
 items.forEach((x,i)=>{
  const div=document.createElement("div");div.className="sample";
  div.innerHTML=`<input class="samplecheck" type="checkbox" ${x.selected?"checked":""}><button class="play">▶</button><div class="samplemain"><div class="sampletitle">${esc(makeSampleName(x,i,q))}</div><div class="samplemeta">SOURCE CANDIDATE · ${Number(x.views||0).toLocaleString("fr-FR")} views · ${esc(x.ageLabel||"")}</div></div><div class="sampleactions"><a class="sourcebtn" href="${esc(x.url)}" target="_blank" rel="noopener">SOURCE ↗</a></div><div class="preview"></div>`;
  const cb=div.querySelector(".samplecheck");cb.onchange=()=>{x.selected=cb.checked;updateSelectedButton()};
  div.querySelector(".play").onclick=()=>togglePreview(div,x);
  box.appendChild(div);
 });
 $("sourcesList").innerHTML=items.map((x,i)=>`<div class="sourceitem"><span>${i+1}. ${esc(x.channel)} · ${esc(x.title)}</span><a href="${esc(x.url)}" target="_blank" rel="noopener">YouTube ↗</a></div>`).join("");
 $("pack").classList.remove("hidden");updateSelectedButton();
}
function makeSampleName(x,i,q){
 const t=(x.title||"").replace(/#\\w+/g,"").replace(/\\s+/g," ").trim();
 return t.length>64?t.slice(0,61)+"…":t||`Vocal fragment ${String(i+1).padStart(2,"0")}`;
}
function togglePreview(div,x){
 let p=div.querySelector(".preview");
 if(!p.classList.contains("open")){p.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(x.id)}?rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;p.classList.add("open");p.style.gridColumn="2 / -1";p.style.width="100%"}
 else{p.classList.remove("open");p.innerHTML=""}
}
function updateSelectedButton(){
 const n=currentItems.filter(x=>x.selected).length;
 $("addSelected").disabled=!n;
 $("addSelected").textContent=n?`ADD ${n} TO MY PACK`:"SELECT SAMPLES";
}
function addSelected(){
 const selected=currentItems.filter(x=>x.selected);
 for(const x of selected)if(!state.pack.some(y=>y.id===x.id))state.pack.push(x);
 savePack();renderPack();
 $("status").textContent=`${selected.length} source candidate(s) added to MY PACK.`;
}
function savePack(){localStorage.setItem("osrMyPack",JSON.stringify(state.pack))}
function renderPack(){
 $("packCount").textContent=`${state.pack.length} SAMPLE${state.pack.length===1?"":"S"}`;
 $("myPack").classList.toggle("hidden",state.pack.length===0);
 $("packItems").innerHTML=state.pack.length?state.pack.map((x,i)=>`<div class="packrow"><div><strong>${String(i+1).padStart(2,"0")} · ${esc(x.title)}</strong><div class="meta">${esc(x.channel)} · <a href="${esc(x.url)}" target="_blank" rel="noopener">SOURCE ↗</a></div></div><button class="removePack" data-id="${esc(x.id)}">×</button></div>`).join(""):"<div class='meta'>Your pack is empty.</div>";
 document.querySelectorAll(".removePack").forEach(b=>b.onclick=()=>{state.pack=state.pack.filter(x=>x.id!==b.dataset.id);savePack();renderPack()});
}
function exportPack(){
 $("exportNote").textContent=state.pack.length
  ?"Audio extraction is the next processing step. This V10 does not fake-download source videos; the worker will create the actual WAV samples once connected."
  :"Your pack is empty.";
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
