const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
};

const API_URL = "https://agile-cooperation-production.up.railway.app";

let currentSlide = 0;
let itensSelecionados = new Set();

// NOVAS VARIÁVEIS PARA A GALERIA
let allItems = [];
let currentCat = 'TODAS';
let currentYear = 'TODOS';

/* ================= INIT ================= */
window.onload = () => {
  setupYears();
  verificarLogin();
  renderAll();

  setInterval(() => moveSlide(1), 5000);
  setInterval(updateClock, 1000);
};

/* ================= LOGIN ================= */
function verificarLogin() {
  const logado = localStorage.getItem("admin_logado");

  if (logado === "true") {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
  } else {
    document.getElementById("login-box").style.display = "block";
    document.getElementById("admin-panel").style.display = "none";
  }
}

async function efetuarLogin() {
  const email = document.getElementById("adm-email").value;
  const pass = document.getElementById("adm-pass").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password: pass })
    });

    const result = await res.json();

    if (result.success) {
      localStorage.setItem("admin_logado","true");
      verificarLogin();
      alert("Login OK");
    } else {
      alert("Erro login");
    }

  } catch {
    alert("Erro servidor");
  }
}

function logout() {
  localStorage.removeItem("admin_logado");
  verificarLogin();
}

/* ================= UPLOAD ================= */
async function uploadCloudinary() {
  const file = document.getElementById("new-img-file").files[0];
  const cat = document.getElementById("new-img-cat").value;
  const year = document.getElementById("new-img-year").value;

  if (!file) return alert("Selecione arquivo");

  const form = new FormData();
  form.append("image", file);
  form.append("category", cat);
  form.append("year", year);

  await fetch(`${API_URL}/items`, { method:"POST", body:form });

  renderAll();
}

/* ================= RENDER ================= */
async function renderAll() {
  try {
    const res = await fetch(`${API_URL}/items`);
    const data = await res.json();
    
    // Salva os itens globalmente para os filtros funcionarem
    allItems = data; 

    /* GALERIA (Agora usa a função separada para permitir os filtros) */
    renderGaleria();

    /* CARROSSEL */
    const track = document.getElementById("track-home");
    if (track) {
      const slides = data
        .filter(i => i.category === "SLIDE" || i.category === "SLIDE (HOME)")
        .slice(-7);

      track.innerHTML = slides.length
        ? slides.map(s => `<img src="${s.imageUrl}">`).join("")
        : `<img src="IMG/escola.jpg">`;
    }

    /* LOGO */
    const logo = data.slice().reverse().find(i => i.category==="LOGO");
    const logoEl = document.getElementById("main-logo-img");
    if (logo && logoEl) logoEl.src = logo.imageUrl;

    /* FOTO SOBRE */
    const sobre = data.slice().reverse().find(i => i.category==="SOBRE" || i.category==="FOTO ESCOLA");
    const sobreEl = document.getElementById("img-sobre-display");
    if (sobre && sobreEl) sobreEl.src = sobre.imageUrl;

    /* ADMIN GRID - CORREÇÃO DO ID PARA O DELETE (Tenta _id ou id) */
    const admin = document.getElementById("lista-admin");
    if (admin) {
      admin.innerHTML = data.map(i => `
        <div class="admin-item">
          <input type="checkbox" onchange="toggleSelect('${i._id || i.id}')">
          <img src="${i.imageUrl}">
        </div>
      `).join("");
    }

    /* CALENDÁRIO */
    const lista = document.getElementById("calendar-list");
    if (lista) {
      if (typeof EVENTOS_ESCOLARES !== 'undefined') {
        lista.innerHTML = EVENTOS_ESCOLARES.map((ev) => {
          const d = new Date(ev.data);
          return `
            <div class="event-row">
              <div class="event-date">${d.getDate()}</div>
              <div>
                <h4>${ev.titulo}</h4>
                <small>${ev.cat}</small>
              </div>
            </div>
          `;
        }).join("");
      } else {
        lista.innerHTML = "<p style='padding:10px;'>Calendário indisponível no momento.</p>";
      }
    }
  } catch (error) {
    console.error("Erro ao renderizar itens:", error);
  }
}

/* ================= FILTROS E RENDERIZAÇÃO DA GALERIA ================= */
function renderGaleria() {
  const grid = document.getElementById("main-grid");
  if (!grid) return;

  // 1. Filtra primeiro apenas as categorias que pertencem à galeria
  let filtrados = allItems.filter(i =>
    ["ATIVIDADES","DESFILE","EVENTOS","INFRAESTRUTURA","HOMENAGEM"].includes((i.category || "").toUpperCase())
  );

  // 2. Filtra pela categoria selecionada no menu
  if (currentCat !== 'TODAS') {
    filtrados = filtrados.filter(i => (i.category || "").toUpperCase() === currentCat);
  }

  // 3. Filtra pelo ano selecionado no dropdown
  if (currentYear !== 'TODOS') {
    filtrados = filtrados.filter(i => String(i.year) === String(currentYear));
  }

  // Renderiza no HTML
  grid.innerHTML = filtrados.reverse().map(i => `
    <div class="gallery-item">
      <img src="${i.imageUrl}">
    </div>
  `).join("");
}

function filtrarCat(cat, btn) {
  currentCat = cat.toUpperCase();

  // Muda a cor do botão ativo
  if (btn) {
    document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
  }

  renderGaleria();
}

function filtrarAno(ano) {
  currentYear = ano;
  renderGaleria();
}

/* ================= DELETE ================= */
function toggleSelect(id){
  itensSelecionados.has(id)
    ? itensSelecionados.delete(id)
    : itensSelecionados.add(id);
}

async function excluirSelecionados(){
  if (!itensSelecionados.size) return alert("Selecione");

  await Promise.all(
    [...itensSelecionados].map(id =>
      fetch(`${API_URL}/items/${id}`, { method:"DELETE" })
    )
  );

  itensSelecionados.clear();
  renderAll();
}

/* ================= UI ================= */
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
    p.style.display="none";
  });

  const el = document.getElementById(id);
  if (el) {
    el.style.display="block";
    el.classList.add("active");
  }

  document.querySelectorAll(".nav-btn")
    .forEach(b=>b.classList.remove("active"));

  document.getElementById("btn-"+id)?.classList.add("active");
}

function setupYears() {
  let optsGallery = "<option value='TODOS'>Todos os Anos</option>";
  let optsUpload = "";

  for (let i = 2026; i >= 1970; i--) {
    optsGallery += `<option value='${i}'>${i}</option>`;
    optsUpload += `<option value='${i}'>${i}</option>`;
  }

  const yearSelectorGallery = document.getElementById("year-selector");
  if (yearSelectorGallery) yearSelectorGallery.innerHTML = optsGallery;

  const newImgYear = document.getElementById("new-img-year");
  if (newImgYear) newImgYear.innerHTML = optsUpload;
}

async function excluirSelecionados() {
  if (!itensSelecionados.size) return alert("Selecione um item para excluir.");

  try {
    await Promise.all(
      [...itensSelecionados].map(async (id) => {
        const res = await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
        if (!res.ok) {
          console.warn(`Aviso: Item ${id} deu erro 404 (pode já ter sido excluído no backend).`);
        }
      })
    );

  fetch('https://agile-cooperation-production.up.railway.app/items', { method: 'OPTIONS' })
  .then(res => {
    console.log("Métodos permitidos:", res.headers.get('access-control-allow-methods'));
    console.log("Todos os headers:", Object.fromEntries(res.headers.entries()));
  })
  .catch(err => console.error("Erro no teste:", err));
    
    alert("Exclusão finalizada!");
  } catch (error) {
    console.error("Erro na exclusão:", error);
  }

  itensSelecionados.clear();
  renderAll(); // Atualiza a tela independente de ter dado 404
}

function moveSlide(step){
  const track=document.getElementById("track-home");
  if(!track) return;
  const slides=track.querySelectorAll("img");

  if(!slides||slides.length<=1) return;

  currentSlide=(currentSlide+step)%slides.length;
  track.style.transform=`translateX(-${currentSlide*100}%)`;
}

function updateClock(){
  const c=document.getElementById("cal-clock");
  if(c) c.innerText=new Date().toLocaleTimeString("pt-BR");
}


