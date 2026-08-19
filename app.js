const $=id=>document.getElementById(id);
$("search").onclick=async()=>{
  const btn=$("search"), results=$("results"), status=$("status");
  const q=$("query").value.trim();
  if(!q){status.textContent="Écris une recherche.";return}
  btn.disabled=true; status.textContent="Recherche...";
  results.innerHTML="";
  try{
    const params=new URLSearchParams({
      q, count:$("count").value, maxViews:$("views").value, duration:$("duration").value
    });
    const r=await fetch("/api/search?"+params);
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"Erreur");
    status.textContent=`${data.items.length} résultat(s) trouvé(s).`;
    data.items.forEach(x=>{
      const el=document.createElement("article"); el.className="card";
      el.innerHTML=`<img class="thumb" src="${x.thumbnail}" alt="">
        <div><div class="title">${escapeHtml(x.title)}</div>
        <div class="meta">${escapeHtml(x.channel)} · ${x.views.toLocaleString("fr-FR")} vues · ${x.duration||"durée inconnue"}</div></div>
        <div class="actions"><a class="open" href="${x.url}" target="_blank" rel="noopener">OPEN</a></div>`;
      results.appendChild(el);
    });
  }catch(e){status.textContent=e.message}
  finally{btn.disabled=false}
};
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
