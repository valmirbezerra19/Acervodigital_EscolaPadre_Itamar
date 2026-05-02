/* ================= CONFIGURAÇÕES E CONSTANTES ================= */
const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
};

const API_URL = "https://agile-cooperation-production.up.railway.app";

const EVENTOS_ESCOLARES = [
  { data: "2026-02-09", titulo: "Início do Ano Letivo", cat: "ACADÊMICO" },
  { data: "2026-03-27", titulo: "Reunião Pedagógica", cat: "PEDAGÓGICO" },
  { data: "2026-05-10", titulo: "Homenagem Dia das Mães", cat: "SOCIAL" },
  { data: "2026-06-20", titulo: "Festa Junina", cat: "EVENTO" },
  { data: "2026-09-07", titulo: "Desfile de Independência", cat: "CÍVICO" },
  { data: "2026-11-20", titulo: "Mostra Cultural 50 Anos", cat: "CULTURAL" },
  { data: "2026-12-16", titulo: "Encerramento e Formatura", cat: "SOLENIDADE" },
  { data: "2026-12-30", titulo: "Fechamento Administrativo", cat: "ADMINISTRATIVO" }
];

/* ================= VARIÁVEIS GLOBAIS ================= */
let currentSlide = 0;
let itensSelecionados = new Set();
let allItems = [];
let currentCat = "TODAS";
let currentYear = "TODOS";
let intervalRelogio = null;

/* ================= INIT ================= */
window.onload = () => {
  setupYears();
  verificarLogin();
  
  // Renderiza o calendário imediatamente (sem depender da API)
  renderCalendar();
  
  // Inicia a busca de dados da galeria/carrosel
  renderAll();

  // Intervalos globais
  setInterval(() => moveSlide(1), 5000);
};

/* ================= LOGIN ================= */
function verificarLogin() {
  const logado = localStorage.getItem("admin_logado");
  const loginBox = document.getElementById("login-box");
  const adminPanel = document.getElementById("admin-panel");

  if (logado === "true") {
    if (loginBox) loginBox.style.display = "none";
    if (adminPanel) adminPanel.style.display = "block";
  } else {
    if (loginBox) loginBox.style.display = "block";
    if (adminPanel) adminPanel.style.display = "none";
  }
}

async function efetuarLogin() {
  const email = document.getElementById("adm-email").value;
  const pass = document.getElementById("adm-pass").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const result = await res.json();

    if (result.success) {
      localStorage.setItem("admin_logado", "true");
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
  const fileEl = document.getElementById("new-img-file");
  const catEl = document.getElementById("new-img-cat");
  const yearEl = document.getElementById("new-img-year");

  if (!fileEl.files[0]) return alert("Selecione arquivo");

  const form = new FormData();
  form.append("image", fileEl.files[0]);
  form.append("category", catEl.value);
  form.append("year", yearEl.value);

  await fetch(`${API_URL}/items`, { method: "POST", body: form });
  renderAll();
}

/* ================= RENDERIZAÇÃO GERAL ================= */
async function renderAll() {
  try {
    const res = await fetch(`${API_URL}/items`);
    const data = await res.json();
    allItems = data;

    renderGaleria();

    /* CARROSSEL */
    const track = document.getElementById("track-home");
    if (track) {
      const slides = data
        .filter((i) => i.category === "SLIDE" || i.category === "SLIDE (HOME)")
        .slice(-7);

      track.innerHTML = slides.length
        ? slides.map((s) => `<img src="${s.imageUrl}">`).join("")
        : `<img src="IMG/escola.jpg">`;
    }

    /* LOGO */
    const logo = data.slice().reverse().find((i) => i.category === "LOGO");
    const logoEl = document.getElementById("main-logo-img");
    if (logo && logoEl) logoEl.src = logo.imageUrl;

    /* FOTO SOBRE */
    const sobre = data.slice().reverse().find((i) => i.category === "SOBRE" || i.category === "FOTO ESCOLA");
    const sobreEl = document.getElementById("img-sobre-display");
    if (sobre && sobreEl) sobreEl.src = sobre.imageUrl;

    /* ADMIN GRID */
    const admin = document.getElementById("lista-admin");
    if (admin) {
      admin.innerHTML = data
        .map((i) => `
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

/* ================= CALENDÁRIO E RELÓGIO ================= */
function renderCalendar() {
  const calList = document.getElementById("calendar-list");
  if (!calList) return;

  calList.innerHTML = EVENTOS_ESCOLARES.map(ev => {
    const d = new Date(ev.data + "T00:00:00");
    const mesStr = d.toLocaleDateString("pt-BR", { month: "short" }).replace('.', '').toUpperCase();

    return `
      <div class="event-row">
        <div class="event-date">
          ${d.getDate()}<br>
          <small>${mesStr}</small>
        </div>
        <div class="event-info">
          <h4>${ev.titulo}</h4>
          <small style="color:var(--accent)">${ev.cat}</small>
        </div>
      </div>
    `;
  }).join("");
}

function iniciarRelogioCalendario() {
  const clock = document.getElementById("cal-clock");
  if (!clock) return;

  const atualizar = () => {
    clock.innerText = new Date().toLocaleTimeString("pt-BR");
  };

  atualizar();
  intervalRelogio = setInterval(atualizar, 1000);
}

/* ================= FILTROS GALERIA ================= */
function renderGaleria() {
  const grid = document.getElementById("main-grid");
  if (!grid) return;

  let filtrados = allItems.filter((i) =>
    ["ATIVIDADES", "DESFILE", "EVENTOS", "INFRAESTRUTURA", "HOMENAGEM"].includes((i.category || "").toUpperCase())
  );

  if (currentCat !== "TODAS") {
    filtrados = filtrados.filter((i) => (i.category || "").toUpperCase() === currentCat);
  }

  if (currentYear !== "TODOS") {
    filtrados = filtrados.filter((i) => String(i.year) === String(currentYear));
  }

  grid.innerHTML = filtrados
    .reverse()
    .map((i) => `<div class="gallery-item"><img src="${i.imageUrl}"></div>`)
    .join("");
}

function filtrarCat(cat, btn) {
  currentCat = cat.toUpperCase();
  if (btn) {
    document.querySelectorAll(".filter-pills .pill").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
  }
  renderGaleria();
}

function filtrarAno(ano) {
  currentYear = ano;
  renderGaleria();
}

/* ================= DELETE ================= */
function toggleSelect(id) {
  itensSelecionados.has(id) ? itensSelecionados.delete(id) : itensSelecionados.add(id);
}

async function excluirSelecionados() {
  if (!itensSelecionados.size) return alert("Selecione um item para excluir.");

  try {
    await Promise.all(
      [...itensSelecionados].map(async (id) => {
        await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
      })
    );
    alert("Exclusão finalizada!");
    itensSelecionados.clear();
    renderAll();
  } catch (error) {
    console.error("Erro na exclusão:", error);
  }
}

/* ================= NAVEGAÇÃO E UI ================= */
function showPage(id) {
  // Troca de páginas
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none";
  });

  const el = document.getElementById(id);
  if (el) {
    el.style.display = "block";
    el.classList.add("active");

    // Lógica específica do Calendário
    if (id === "calendario") {
      renderCalendar();
      if (!intervalRelogio) iniciarRelogioCalendario();
    } else {
      // Limpa relógio ao sair para poupar recursos
      if (intervalRelogio) {
        clearInterval(intervalRelogio);
        intervalRelogio = null;
      }
    }
  }

  // Atualiza botões da Nav
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const btnAtivo = document.getElementById("btn-" + id);
  if (btnAtivo) btnAtivo.classList.add("active");
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

function moveSlide(step) {
  const track = document.getElementById("track-home");
  if (!track) return;
  const slides = track.querySelectorAll("img");
  if (slides.length <= 1) return;

  currentSlide = (currentSlide + step) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}
