const $=id=>document.getElementById(id);
let state={count:10,maxViews:10000,selected:new Set(),page:0};

const pools={
drums:["obscure hand percussion live recording","old drum session","strange percussion performance","found object percussion","rare frame drum recording","street percussion live","amateur rhythm session","old tribal percussion recording","unusual drum performance","weird rhythmic performance"],
instruments:["old piano performance recording","forgotten organ performance","obscure guitar session","strange instrument demonstration","old synthesizer performance","traditional instrument live recording","rare string instrument performance","amateur keyboard session","old accordion recording","unknown instrument performance"],
vocals:["obscure female vocal live session","old male singer recording","forgotten soul singer live","strange choir recording","old gospel singer recording","intimate acoustic vocal session","female folk singer live","vocal harmony live session","spoken voice old recording","unknown singer microphone recording"],
textures:["sound of sea","old cassette room tone","rain recorded indoors","factory ambience recording","old radio static recording","train station ambience","wind through trees recording","crowd ambience old recording","underwater recording","old tape machine sounds"],
weird:["old man explaining a strange machine","forgotten local TV performance","people singing in a train","unknown woman singing into a microphone","strange instrument demonstration 1970","amateur wedding recording","weird Japanese commercial music","old school performance recording","strange factory demonstration","someone playing an instrument nobody knows"]
};

document.querySelectorAll(".pack-types button").forEach(b=>b.onclick=()=>{
  const pool=pools[b.dataset.kind];
  $("query").value=pool[Math.floor(Math.random()*pool.length)];
  document.querySelectorAll(".pack-types button").forEach(x=>x.classList.remove("selected"));
  b.classList.add("selected");
});
document.querySelectorAll("#count button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#count button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); state.count=Number(b.dataset.count);
});
document.querySelectorAll("#views button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#views button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); state.maxViews=Number(b.dataset.views);
});
$("hunt").onclick=()=>hunt(false); $("keep").onclick=()=>hunt(true);

async function hunt(more){
  const q=$("query").value.trim();
  if(!q){$("status").textContent="Tell the hunter what you're looking for.";return}
  if(!more){state.page=0;state.selected.clear();$("results").innerHTML="";updateSelected()}
  $("hunt").disabled=true;$("totem").classList.remove("hidden");$("keep").classList.add("hidden");
  const texts=["digging through the obscure corners","looking under the obvious results","following a weird rabbit hole","checking recent uploads","digging backwards through time","shaking the sample tree"];
  let n=0;const timer=setInterval(()=>{$("totemText").textContent=texts[n++%texts.length]},700);
  try{
    const p=new URLSearchParams({q,count:state.count,maxViews:state.maxViews,page:state.page});
    const r=await fetch("/api/search?"+p),d=await r.json();
    if(!r.ok)throw new Error(d.error||"Search error");
    render(d.items||[]);state.page++;
    $("status").textContent=`${document.querySelectorAll(".card").length} source(s) found.`;
    if(d.hasMore)$("keep").classList.remove("hidden");
  }catch(e){$("status").textContent=e.message}
  finally{clearInterval(timer);$("totem").classList.add("hidden");$("hunt").disabled=false}
}

function render(items){
  for(const x of items){
    const card=document.createElement("article");card.className="card";card.dataset.id=x.id;
    card.innerHTML=`<div class="row"><img class="thumb" src="${x.thumbnail||""}" alt=""><div><div class="title">${esc(x.title)}</div><div class="meta">${esc(x.channel)} · ${x.views.toLocaleString("fr-FR")} views · ${x.duration||"?"}</div></div><div class="actions"><button class="previewBtn">▶ PREVIEW</button><button class="save">＋ SAVE</button></div></div><div class="preview"></div>`;
    card.querySelector(".previewBtn").onclick=()=>{
      const p=card.querySelector(".preview");
      if(!p.classList.contains("open")){p.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(x.id)}?rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;p.classList.add("open")}
      else{p.classList.remove("open");p.innerHTML=""}
    };
    card.querySelector(".save").onclick=()=>{
      const s=card.querySelector(".save");
      if(state.selected.has(x.id)){state.selected.delete(x.id);s.classList.remove("on");s.textContent="＋ SAVE"}
      else{state.selected.add(x.id);s.classList.add("on");s.textContent="✓ SAVED"}
      updateSelected()
    };
    $("results").appendChild(card)
  }
}
function updateSelected(){$("selectedCount").textContent=state.selected.size;$("catchbar").classList.toggle("hidden",state.selected.size===0);$("download").disabled=state.selected.size===0}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
$("download").onclick=()=>alert("MAKE PACK will build a curated pack from your saved segments in the next version.");
