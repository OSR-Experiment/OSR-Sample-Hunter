const $=id=>document.getElementById(id);
let state={pack:JSON.parse(localStorage.getItem("osrMyPack")||"[]")};
$("hunt").onclick=hunt;
$("viewPack").onclick=()=>$("packDrawer").classList.remove("hidden");
$("closePack").onclick=()=>$("packDrawer").classList.add("hidden");
renderPack();

async function hunt(){
 const q=$("query").value.trim();
 if(!q){$("status").textContent="Tell the hunter what vocal you're looking for.";return}
 $("hunt").disabled=true;$("results").innerHTML="";$("strategy").classList.add("hidden");$("totem").classList.remove("hidden");
 const texts=["turning your idea into a hunt","looking for real voices","checking recent uploads","digging through older recordings","avoiding the obvious stuff","finding small human uploads"];
 let n=0;const timer=setInterval(()=>{$("totemText").textContent=texts[n++%texts.length]},650);
 try{
   const p=new URLSearchParams({q});
   const r=await fetch("/api/vocal-hunt?"+p),d=await r.json();
   if(!r.ok)throw new Error(d.error||"Search error");
   $("strategyTags").innerHTML=(d.strategy||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("");
   $("strategy").classList.remove("hidden");
   render(d.items||[]);
   $("status").textContent=`${d.items?.length||0} source(s) found.`;
 }catch(e){$("status").textContent=e.message}
 finally{clearInterval(timer);$("totem").classList.add("hidden");$("hunt").disabled=false}
}

function render(items){
 for(const x of items){
  const card=document.createElement("article");card.className="card";
  const already=state.pack.some(y=>y.id===x.id);
  card.innerHTML=`<div class="row"><img class="thumb" src="${x.thumbnail||""}" alt=""><div><div class="title">${esc(x.title)}</div><div class="meta">${esc(x.channel)} · ${x.views.toLocaleString("fr-FR")} views · ${x.ageLabel}</div><div class="score">${esc(x.reason)}</div><div class="source">SOURCE · <a href="${x.url}" target="_blank" rel="noopener">YouTube ↗</a></div></div><div class="actions"><button class="previewBtn">▶ LISTEN</button><button class="add ${already?"on":""}">${already?"✓ IN PACK":"+ ADD TO PACK"}</button></div></div><div class="preview"></div>`;
  card.querySelector(".previewBtn").onclick=()=>{const p=card.querySelector(".preview");if(!p.classList.contains("open")){p.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(x.id)}?rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;p.classList.add("open")}else{p.classList.remove("open");p.innerHTML=""}};
  card.querySelector(".add").onclick=()=>{
    const idx=state.pack.findIndex(y=>y.id===x.id);
    if(idx>=0){state.pack.splice(idx,1);card.querySelector(".add").classList.remove("on");card.querySelector(".add").textContent="+ ADD TO PACK"}
    else{state.pack.push(x);card.querySelector(".add").classList.add("on");card.querySelector(".add").textContent="✓ IN PACK"}
    savePack();renderPack();
  };
  $("results").appendChild(card);
 }
}
function savePack(){localStorage.setItem("osrMyPack",JSON.stringify(state.pack))}
function renderPack(){
 $("packCount").textContent=`${state.pack.length} SAMPLE${state.pack.length===1?"":"S"}`;
 $("packItems").innerHTML=state.pack.length?state.pack.map((x,i)=>`<div class="packrow"><div><strong>${String(i+1).padStart(2,"0")} · ${esc(x.title)}</strong><div class="meta">${esc(x.channel)} · <a href="${x.url}" target="_blank" rel="noopener">SOURCE ↗</a></div></div><button class="removePack" data-id="${x.id}">×</button></div>`).join(""):"<div class='meta'>Your pack is empty. Go hunting.</div>";
 document.querySelectorAll(".removePack").forEach(b=>b.onclick=()=>{state.pack=state.pack.filter(x=>x.id!==b.dataset.id);savePack();renderPack()});
 $("myPack").classList.toggle("hidden",state.pack.length===0);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;"}[c]))}
$("makePack").onclick=()=>{
 if(!state.pack.length)return;
 alert(`Your pack is ready: ${state.pack.length} selected sources. Automatic segment extraction will build the actual vocal samples in the next worker step.`);
};
