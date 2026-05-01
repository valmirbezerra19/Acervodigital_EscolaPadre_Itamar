const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
  cloud: "defxlhmma",
  preset: "acervo_itamar",
};

const API_URL = "https://agile-cooperation-production.up.railway.app";

let currentSlide = 0;
let itensSelecionados = new Set();

// =========================
// 🚀 INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  showPage("home");
  setupYears();
  renderAll();

  setInterval(() => moveSlide(1), 5000);
  setInterval(updateClock, 1000);
});

// =========================
// 🔥 MENU FUNCIONANDO
// =========================
function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none";
  });

  const page = document.getElementById(id);
  if (page) {
    page.style.display = "block";
    page.classList.add("active");
  }

  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.remove("active");
  });

  document.getElementById("btn-" + id)?.classList.add("active");

  window.scrollTo(0, 0);
}

// =========================
// 🔐 LOGIN
// =========================
async function efetuarLogin() {
  const email = document.getElementById("adm-email").value;
  const pass = document.getElementById("adm-pass").value;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password: pass }),
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    localStorage.setItem("admin_logado", "true");
    renderAll();
  } else {
    alert("Login inválido");
  }
}

// =========================
// ☁️ UPLOAD
// =========================
async function uploadCloudinary() {
  const file = document.getElementById("new-img-file").files[0];
  const cat = document.getElementById("new-img-cat").value;
  const ano = document.getElementById("new-img-year").value;

  if (!file) return alert("Selecione uma imagem");

  const formData = new FormData();
  formData.append("image", file);
  formData.append("category", cat);
  formData.append("year", ano);

  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    alert("Upload feito");
    renderAll();
  } else {
    alert("Erro no upload");
  }
}

// =========================
// 🎯 RENDER
// =========================
async function renderAll() {
  const res = await fetch(`${API_URL}/items`);
  const data = await res.json();

  // 🔹 GALERIA
  const grid = document.getElementById("main-grid");
  if (grid) {
    grid.innerHTML = data
      .filter(i => ["ATIVIDADES","DESFILE","EVENTOS","INFRAESTRUTURA","HOMENAGEM"].includes(i.category))
      .reverse()
      .map(item => `
        <div class="gallery-item">
          <img src="${item.imageUrl}" onclick="window.open('${item.imageUrl}')">
          <p>${item.title}</p>
        </div>
      `).join("");
  }

  // 🔹 CARROSSEL (MAX 7)
  const track = document.getElementById("track-home");
  if (track) {
    const slides = data
      .filter(i => i.category === "SLIDE (HOME)")
      .slice(-7);

    track.innerHTML = slides.length
      ? slides.map(s => `<img src="${s.imageUrl}">`).join("")
      : `<img src="escola.jpg">`;
  }

  // 🔹 LOGO
  const logo = data.slice().reverse().find(i => i.category === "LOGO");
  if (logo) document.getElementById("main-logo-img").src = logo.imageUrl;

  // 🔹 FOTO SOBRE
  const sobre = data.slice().reverse().find(i => i.category === "FOTO ESCOLA");
  if (sobre) document.getElementById("img-sobre-display").src = sobre.imageUrl;

  // 🔹 ADMIN GRID
  const admin = document.getElementById("lista-admin");
  if (admin) {
    admin.innerHTML = data.map(item => `
      <div class="admin-item">
        <input type="checkbox" onchange="toggleSelect('${item._id}')">
        <img src="${item.imageUrl}">
      </div>
    `).join("");
  }
}

// =========================
// 🗑️ SELEÇÃO + EXCLUSÃO
// =========================
function toggleSelect(id) {
  if (itensSelecionados.has(id)) {
    itensSelecionados.delete(id);
  } else {
    itensSelecionados.add(id);
  }
}

async function excluirSelecionados() {
  if (!itensSelecionados.size) return alert("Selecione itens");

  if (!confirm("Deseja excluir selecionados?")) return;

  await Promise.all(
    [...itensSelecionados].map(id =>
      fetch(`${API_URL}/items/${id}`, { method: "DELETE" })
    )
  );

  itensSelecionados.clear();
  renderAll();
}

// =========================
// 📅 UTIL
// =========================
function updateClock() {
  const el = document.getElementById("cal-clock");
  if (el) el.innerText = new Date().toLocaleTimeString("pt-BR");
}

function setupYears() {
  let opts = "";
  for (let i = 2026; i >= 1970; i--) {
    opts += `<option value="${i}">${i}</option>`;
  }

  document.getElementById("year-selector").innerHTML =
    `<option value="TODOS">Todos</option>` + opts;

  document.getElementById("new-img-year").innerHTML = opts;
}

// =========================
// 🎞️ CARROSSEL
// =========================
function moveSlide(step) {
  const track = document.getElementById("track-home");
  const slides = track?.querySelectorAll("img");

  if (!slides || slides.length <= 1) return;

  currentSlide = (currentSlide + step) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}
