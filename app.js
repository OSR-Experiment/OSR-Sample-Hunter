const $=id=>document.getElementById(id);
let state={pack:JSON.parse(localStorage.getItem("osrMyPack")||"[]")},currentItems=[],audio=null,playing=null;

document.addEventListener("DOMContentLoaded",()=>{
 $("hunt").onclick=hunt;$("viewPack").onclick=()=>$("packDrawer").classList.remove("hidden");$("closePack").onclick=()=>$("packDrawer").classList.add("hidden");
 $("addSelected").onclick=addSelected;$("exportPack").onclick=exportPack;renderPack();
});
async function hunt(){
 const q=$("query").value.trim();if(!q){$("status").textContent="Tell the hunter what vocal you're looking for.";return}
 $("hunt").disabled=true;$("pack").classList.add("hidden");$("strategy").classList.add("hidden");$("totem").classList.remove("hidden");
 const texts=["turning your idea into a hunt","looking for real voices","checking recent uploads","digging through older recordings","rejecting obvious AI","building a sample shortlist"];let n=0;
 const timer=setInterval(()=>$("totemText").textContent=texts[n++%texts.length],650);
 try{const r=await fetch("/api/vocal-hunt?q="+encodeURIComponent(q));const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{throw Error("The hunt API did not return JSON.")}if(!r.ok)throw Error(d.error||`API error ${r.status}`);
 currentItems=(d.items||[]).map((x,i)=>({...x,sampleId:x.id+"-"+i,selected:false}));
 $("strategyTags").innerHTML=(d.strategy||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("");$("strategy").classList.remove("hidden");renderSamplePack(currentItems,q);$("status").textContent=`${currentItems.length} vocal candidates found.`;
 }catch(e){console.error(e);$("status").textContent=e.message}finally{clearInterval(timer);$("totem").classList.add("hidden");$("hunt").disabled=false}
}
function renderSamplePack(items,q){
 $("packTitle").textContent=(q.toUpperCase()+" VOCALS").slice(0,52);$("packMeta").textContent=`${items.length} candidates · click ▶ to audition instantly`;
 const box=$("samples");box.innerHTML="";
 items.forEach((x,i)=>{const d=document.createElement("div");d.className="sample";d.innerHTML=`<input class="samplecheck" type="checkbox"><button class="sampleplay" aria-label="Listen">▶</button><div class="samplemain"><div class="sampletitle">${esc(makeName(x,i))}</div><div class="samplemeta">VOCAL CANDIDATE · ${Number(x.views||0).toLocaleString("fr-FR")} views · ${esc(x.ageLabel||"")}</div></div><div class="sampleactions"><a class="sourcebtn" href="${esc(x.url)}" target="_blank" rel="noopener">SOURCE ↗</a></div><div class="preview"></div>`;
  const cb=d.querySelector(".samplecheck");cb.onchange=()=>{x.selected=cb.checked;updateButton()};d.querySelector(".sampleplay").onclick=()=>playPreview(d,x);box.appendChild(d)});
 $("sourceCount").textContent=`${items.length} SOURCES`;$("sourcesList").innerHTML=items.map((x,i)=>`<div class="sourceitem"><span>${i+1}. ${esc(x.channel)} · ${esc(x.title)}</span><a href="${esc(x.url)}" target="_blank" rel="noopener">YouTube ↗</a></div>`).join("");
 $("pack").classList.remove("hidden");updateButton();
}
function makeName(x,i){let t=(x.title||"").replace(/#\w+/g,"").replace(/\s+/g," ").trim();return t.length>70?t.slice(0,67)+"…":t||`Vocal fragment ${String(i+1).padStart(2,"0")}`}
function playPreview(d,x){
 const p=d.querySelector(".preview"),b=d.querySelector(".sampleplay");
 document.querySelectorAll(".sampleplay.playing").forEach(z=>z.classList.remove("playing"));
 if(p.classList.contains("open")){p.classList.remove("open");p.innerHTML="";return}
 document.querySelectorAll(".preview.open").forEach(z=>{z.classList.remove("open");z.innerHTML=""});
 p.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(x.id)}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;p.classList.add("open");b.classList.add("playing");
}
function updateButton(){let n=currentItems.filter(x=>x.selected).length;$("addSelected").disabled=!n;$("addSelected").textContent=n?`ADD ${n} TO MY PACK`:"SELECT SAMPLES"}
function addSelected(){currentItems.filter(x=>x.selected).forEach(x=>{if(!state.pack.some(y=>y.id===x.id))state.pack.push(x)});savePack();renderPack();$("status").textContent="Selected vocal candidates added to MY PACK."}
function savePack(){localStorage.setItem("osrMyPack",JSON.stringify(state.pack))}
function renderPack(){$("packCount").textContent=`${state.pack.length} SAMPLE${state.pack.length===1?"":"S"}`;$("myPack").classList.toggle("hidden",!state.pack.length);$("packItems").innerHTML=state.pack.length?state.pack.map((x,i)=>`<div class="packrow"><div><strong>${String(i+1).padStart(2,"0")} · ${esc(x.title)}</strong><div class="meta">${esc(x.channel)} · <a href="${esc(x.url)}" target="_blank" rel="noopener">SOURCE ↗</a></div></div><button class="removePack" data-id="${esc(x.id)}">×</button></div>`).join(""):"<div class='meta'>Your pack is empty.</div>";document.querySelectorAll(".removePack").forEach(b=>b.onclick=()=>{state.pack=state.pack.filter(x=>x.id!==b.dataset.id);savePack();renderPack()})}
function exportPack(){$("exportNote").textContent=state.pack.length?"The actual WAV extraction is the next processing layer. This interface does not fake-download YouTube audio.":"Your pack is empty."}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
