const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
};

const API_URL = "https://agile-cooperation-production.up.railway.app";

let currentSlide = 0;
let itensSelecionados = new Set();

let allItems = [];
let currentCat = 'TODAS';
let currentYear = 'TODOS';

/* ================= CALENDÁRIO (CORRIGIDO) ================= */

const EVENTOS_ESCOLARES = [
  { data: "2026-02-09", titulo: "Início do Ano Letivo", cat: "ACADÊMICO" },
  { data: "2026-03-27", titulo: "Reunião Pedagógica", cat: "PEDAGÓGICO" },
  { data: "2026-05-10", titulo: "Homenagem Dia das Mães", cat: "SOCIAL" },
  { data: "2026-06-20", titulo: "Festa Junina", cat: "EVENTO" },
  { data: "2026-09-07", titulo: "Desfile de Independência", cat: "CÍVICO" },
  { data: "2026-11-20", titulo: "Mostra Cultural 50 Anos", cat: "CULTURAL" },
  { data: "2026-12-16", titulo: "Encerramento e Formatura", cat: "SOLENIDADE" },
];

function renderCalendar() {
  const calList = document.getElementById("calendar-list");
  if (!calList) return;

  calList.innerHTML = EVENTOS_ESCOLARES.map((ev) => {
    const d = new Date(ev.data + "T00:00:00");

    return `
      <div class="event-row">
        <div class="event-date">
          ${d.getDate()}<br>
          <small>${d.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase()}</small>
        </div>
        <div>
          <h4>${ev.titulo}</h4>
          <small>${ev.cat}</small>
        </div>
      </div>
    `;
  }).join("");
}

function updateClock(){
  const c = document.getElementById("cal-clock");
  if(c) c.innerText = new Date().toLocaleTimeString("pt-BR");
}

/* ================= INIT ================= */

window.onload = () => {
  setupYears();
  verificarLogin();

  renderCalendar(); // 🔥 CORREÇÃO PRINCIPAL
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

    allItems = data;

    renderGaleria();

    const track = document.getElementById("track-home");
    if (track) {
      const slides = data
        .filter(i => i.category === "SLIDE" || i.category === "SLIDE (HOME)")
        .slice(-7);

      track.innerHTML = slides.length
        ? slides.map(s => `<img src="${s.imageUrl}">`).join("")
        : `<img src="IMG/escola.jpg">`;
    }

    const logo = data.slice().reverse().find(i => i.category==="LOGO");
    const logoEl = document.getElementById("main-logo-img");
    if (logo && logoEl) logoEl.src = logo.imageUrl;

    const sobre = data.slice().reverse().find(i => i.category==="SOBRE" || i.category==="FOTO ESCOLA");
    const sobreEl = document.getElementById("img-sobre-display");
    if (sobre && sobreEl) sobreEl.src = sobre.imageUrl;

    const admin = document.getElementById("lista-admin");
    if (admin) {
      admin.innerHTML = data.map(i => `
        <div class="admin-item">
          <input type="checkbox" onchange="toggleSelect('${i._id || i.id}')">
          <img src="${i.imageUrl}">
        </div>
      `).join("");
    }
  } catch (error) {
    console.error("Erro ao renderizar itens:", error);
  }
}

/* ================= RESTANTE (INALTERADO) ================= */

function renderGaleria() {
  const grid = document.getElementById("main-grid");
  if (!grid) return;

  let filtrados = allItems.filter(i =>
    ["ATIVIDADES","DESFILE","EVENTOS","INFRAESTRUTURA","HOMENAGEM"].includes((i.category || "").toUpperCase())
  );

  if (currentCat !== 'TODAS') {
    filtrados = filtrados.filter(i => (i.category || "").toUpperCase() === currentCat);
  }

  if (currentYear !== 'TODOS') {
    filtrados = filtrados.filter(i => String(i.year) === String(currentYear));
  }

  grid.innerHTML = filtrados.reverse().map(i => `
    <div class="gallery-item">
      <img src="${i.imageUrl}">
    </div>
  `).join("");
}

function filtrarCat(cat, btn) {
  currentCat = cat.toUpperCase();

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

function toggleSelect(id){
  itensSelecionados.has(id)
    ? itensSelecionados.delete(id)
    : itensSelecionados.add(id);
}

async function excluirSelecionados() {
  if (!itensSelecionados.size) return alert("Selecione um item para excluir.");

  try {
    await Promise.all(
      [...itensSelecionados].map(id =>
        fetch(`${API_URL}/items/${id}`, { method: "DELETE" })
      )
    );
    alert("Exclusão finalizada!");
  } catch (error) {
    console.error(error);
  }

  itensSelecionados.clear();
  renderAll();
}

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

  document.getElementById("year-selector").innerHTML = optsGallery;
  document.getElementById("new-img-year").innerHTML = optsUpload;
}

function moveSlide(step){
  const track=document.getElementById("track-home");
  if(!track) return;
  const slides=track.querySelectorAll("img");

  if(!slides||slides.length<=1) return;

  currentSlide=(currentSlide+step)%slides.length;
  track.style.transform=`translateX(-${currentSlide*100}%)`;
}
