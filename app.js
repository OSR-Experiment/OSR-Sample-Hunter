const $ = (id) => document.getElementById(id);

let state = {
  pack: JSON.parse(localStorage.getItem("osrMyPack") || "[]")
};

document.addEventListener("DOMContentLoaded", () => {
  const hunt = $("hunt");
  const viewPack = $("viewPack");
  const closePack = $("closePack");

  if (!hunt) return;

  hunt.addEventListener("click", huntNow);

  if (viewPack) viewPack.addEventListener("click", () => $("packDrawer").classList.remove("hidden"));
  if (closePack) closePack.addEventListener("click", () => $("packDrawer").classList.add("hidden"));

  renderPack();
});

async function huntNow() {
  const q = $("query").value.trim();

  if (!q) {
    $("status").textContent = "Tell the hunter what vocal you're looking for.";
    return;
  }

  const button = $("hunt");
  button.disabled = true;
  $("results").innerHTML = "";
  $("strategy").classList.add("hidden");
  $("totem").classList.remove("hidden");

  const texts = [
    "turning your idea into a hunt",
    "looking for real voices",
    "checking recent uploads",
    "digging through older recordings",
    "avoiding the obvious stuff",
    "finding small human uploads"
  ];

  let n = 0;
  const timer = setInterval(() => {
    $("totemText").textContent = texts[n++ % texts.length];
  }, 650);

  try {
    const response = await fetch("/api/vocal-hunt?q=" + encodeURIComponent(q), {
      headers: { "Accept": "application/json" }
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("The Vercel API did not return JSON. Check the API deployment and YOUTUBE_API_KEY.");
    }

    if (!response.ok) throw new Error(data.error || `API error ${response.status}`);

    $("strategyTags").innerHTML = (data.strategy || [])
      .map(x => `<span class="tag">${esc(x)}</span>`)
      .join("");

    $("strategy").classList.remove("hidden");
    render(data.items || []);
    $("status").textContent = `${(data.items || []).length} source(s) found.`;
  } catch (error) {
    console.error(error);
    $("status").textContent = error.message || "Something went wrong.";
  } finally {
    clearInterval(timer);
    $("totem").classList.add("hidden");
    button.disabled = false;
  }
}

function render(items) {
  const results = $("results");

  if (!items.length) {
    results.innerHTML = `<div class="card"><div class="meta">No good sources found. Try a slightly broader hunt.</div></div>`;
    return;
  }

  for (const x of items) {
    const card = document.createElement("article");
    card.className = "card";

    const already = state.pack.some(y => y.id === x.id);

    card.innerHTML = `
      <div class="row">
        <img class="thumb" src="${esc(x.thumbnail || "")}" alt="">
        <div>
          <div class="title">${esc(x.title)}</div>
          <div class="meta">${esc(x.channel)} · ${Number(x.views || 0).toLocaleString("fr-FR")} views · ${esc(x.ageLabel || "")}</div>
          <div class="score">${esc(x.reason || "")}</div>
          <div class="source">SOURCE · <a href="${esc(x.url)}" target="_blank" rel="noopener">YouTube ↗</a></div>
        </div>
        <div class="actions">
          <button class="previewBtn">▶ LISTEN</button>
          <button class="add ${already ? "on" : ""}">${already ? "✓ IN PACK" : "+ ADD TO PACK"}</button>
        </div>
      </div>
      <div class="preview"></div>
    `;

    card.querySelector(".previewBtn").addEventListener("click", () => {
      const preview = card.querySelector(".preview");

      if (!preview.classList.contains("open")) {
        preview.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(x.id)}?rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        preview.classList.add("open");
      } else {
        preview.classList.remove("open");
        preview.innerHTML = "";
      }
    });

    card.querySelector(".add").addEventListener("click", () => {
      const index = state.pack.findIndex(y => y.id === x.id);

      if (index >= 0) {
        state.pack.splice(index, 1);
      } else {
        state.pack.push(x);
      }

      savePack();
      renderPack();

      const addButton = card.querySelector(".add");
      const inPack = state.pack.some(y => y.id === x.id);
      addButton.classList.toggle("on", inPack);
      addButton.textContent = inPack ? "✓ IN PACK" : "+ ADD TO PACK";
    });

    results.appendChild(card);
  }
}

function savePack() {
  localStorage.setItem("osrMyPack", JSON.stringify(state.pack));
}

function renderPack() {
  const count = $("packCount");
  const drawer = $("myPack");
  const items = $("packItems");

  if (!count || !drawer || !items) return;

  count.textContent = `${state.pack.length} SAMPLE${state.pack.length === 1 ? "" : "S"}`;

  items.innerHTML = state.pack.length
    ? state.pack.map((x, i) => `
        <div class="packrow">
          <div>
            <strong>${String(i + 1).padStart(2, "0")} · ${esc(x.title)}</strong>
            <div class="meta">${esc(x.channel)} · <a href="${esc(x.url)}" target="_blank" rel="noopener">SOURCE ↗</a></div>
          </div>
          <button class="removePack" data-id="${esc(x.id)}">×</button>
        </div>
      `).join("")
    : "<div class='meta'>Your pack is empty. Go hunting.</div>";

  document.querySelectorAll(".removePack").forEach(button => {
    button.addEventListener("click", () => {
      state.pack = state.pack.filter(x => x.id !== button.dataset.id);
      savePack();
      renderPack();
    });
  });

  drawer.classList.toggle("hidden", state.pack.length === 0);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
