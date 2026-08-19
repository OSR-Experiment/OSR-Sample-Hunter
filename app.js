const $=id=>document.getElementById(id);
let state={count:10,maxViews:10000};
document.querySelectorAll("#count button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#count button").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.count=Number(b.dataset.count)});
document.querySelectorAll("#views button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#views button").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.maxViews=Number(b.dataset.views)});
$("hunt").onclick=hunt;

async function hunt(){
 const q=$("query").value.trim();
 if(!q){$("status").textContent="Tell the hunter what vocal you're looking for.";return}
 $("hunt").disabled=true;$("results").innerHTML="";$("strategy").classList.add("hidden");$("totem").classList.remove("hidden");
 const texts=["turning your idea into a hunt","looking for real voices","checking recent uploads","digging through older recordings","avoiding the obvious stuff","finding small human uploads"];
 let n=0;const timer=setInterval(()=>{$("totemText").textContent=texts[n++%texts.length]},650);
 try{
   const p=new URLSearchParams({q,count:state.count,maxViews:state.maxViews});
   const r=await fetch("/api/vocal-hunt?"+p),d=await r.json();
   if(!r.ok)throw new Error(d.error||"Search error");
   $("strategyTags").innerHTML=(d.strategy||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("");
   $("strategy").classList.remove("hidden");
   render(d.items||[]);
   $("status").textContent=`${d.items?.length||0} candidate source(s) found.`;
 }catch(e){$("status").textContent=e.message}
 finally{clearInterval(timer);$("totem").classList.add("hidden");$("hunt").disabled=false}
}

function render(items){
 for(const x of items){
  const card=document.createElement("article");card.className="card";
  card.innerHTML=`<div class="row"><img class="thumb" src="${x.thumbnail||""}" alt=""><div><div class="title">${esc(x.title)}</div><div class="meta">${esc(x.channel)} · ${x.views.toLocaleString("fr-FR")} views · ${x.ageLabel}</div><div class="score">${esc(x.reason)}</div></div><div class="actions"><button class="previewBtn">▶ PREVIEW</button><a href="${x.url}" target="_blank" rel="noopener">YOUTUBE</a></div></div><div class="preview"></div>`;
  card.querySelector(".previewBtn").onclick=()=>{const p=card.querySelector(".preview");if(!p.classList.contains("open")){p.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(x.id)}?rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;p.classList.add("open")}else{p.classList.remove("open");p.innerHTML=""}};
  $("results").appendChild(card);
 }
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
