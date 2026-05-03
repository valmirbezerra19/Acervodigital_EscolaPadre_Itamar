const API_URL = "https://agile-cooperation-production.up.railway.app";
const ADMIN_TOKEN_KEY = "admin_token";

let currentSlide = 0;
let itensSelecionados = new Set();

// NOVAS VARIÁVEIS PARA A GALERIA
let allItems = [];
let currentCat = "TODAS";
let currentYear = "TODOS";

// EVENTOS DO CALENDÁRIO ESCOLAR
const EVENTOS_ESCOLARES = [
  { data: "2026-02-09", titulo: "Início do Ano Letivo", cat: "ACADÊMICO" },
  { data: "2026-03-27", titulo: "Reunião Pedagógica", cat: "PEDAGÓGICO" },
  { data: "2026-05-10", titulo: "Homenagem Dia das Mães", cat: "SOCIAL" },
  { data: "2026-02-09", titulo: "Início do Ano Letivo", cat: "ACADÊMICO" },
  { data: "2026-03-27", titulo: "Reunião Pedagógica", cat: "PEDAGÓGICO" },
  { data: "2026-05-10", titulo: "Homenagem Dia das Mães", cat: "SOCIAL" },
  { data: "2026-06-20", titulo: "Festa Junina", cat: "EVENTO" },
  { data: "2026-09-07", titulo: "Desfile de Independência", cat: "CÍVICO" },
  { data: "2026-11-20", titulo: "Mostra Cultural 50 Anos", cat: "CULTURAL" },
  { data: "2026-12-16", titulo: "Encerramento e Formatura", cat: "SOLENIDADE" },
];

/* ================= INIT ================= */
window.onload = () => {
  setupYears();
  verificarLogin();
  gerarCalendario();
  renderAll();
  setInterval(() => moveSlide(1), 5000);
  setInterval(updateClock, 1000);
};

/* ================= LOGIN ================= */
function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem("admin_logado");
}

function verificarLogin() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
  } else {
    document.getElementById("login-box").style.display = "block";
    document.getElementById("admin-panel").style.display = "none";
  }
}

function resolveUnauthorized(res) {
  if (res.status === 401) {
    clearAdminSession();
    verificarLogin();
    alert("Sessão expirada. Faça login novamente.");
    return true;
  }
  return false;
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
    if (result.success && result.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
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
  clearAdminSession();
  verificarLogin();
}

/* ================= UPLOAD (CORRIGIDO PARA MOSTRAR MENSAGEM) ================= */
async function uploadCloudinary() {
  const fileInput = document.getElementById("new-img-file");
  const file = fileInput.files[0];
  const cat = document.getElementById("new-img-cat").value;
  const year = document.getElementById("new-img-year").value;

  if (!file) return alert("Selecione arquivo");

  const form = new FormData();
  form.append("image", file);
  form.append("category", cat);
  form.append("year", year);

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return alert("Faça login para enviar arquivos.");

  try {
    const res = await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (resolveUnauthorized(res)) return;

    if (res.ok) {
      // O Alerta deve vir ANTES de qualquer outra ação para garantir que o navegador o processe
      alert("Imagem enviada com sucesso!");
      fileInput.value = ""; 
      renderAll();
    } else {
      alert("Erro no upload: Verifique o console.");
    }
  } catch (error) {
    console.error("Erro no envio:", error);
    alert("Erro de conexão com o servidor Railway.");
  }
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
        .filter((i) => i.category === "SLIDE" || i.category === "SLIDE (HOME)")
        .slice(-7);
      track.innerHTML = slides.length
        ? slides.map((s) => `<img src="${s.imageUrl}">`).join("")
        : `<img src="IMG/escola.jpg">`;
    }

    const logo = data.slice().reverse().find((i) => i.category === "LOGO");
    if (logo && document.getElementById("main-logo-img")) document.getElementById("main-logo-img").src = logo.imageUrl;

    const sobre = data.slice().reverse().find((i) => i.category === "SOBRE" || i.category === "FOTO ESCOLA");
    if (sobre && document.getElementById("img-sobre-display")) document.getElementById("img-sobre-display").src = sobre.imageUrl;

    const admin = document.getElementById("lista-admin");
    if (admin) {
      admin.innerHTML = data
        .map(
          (i) => `
        <div class="admin-item">
          <input type="checkbox" onchange="toggleSelect('${i._id || i.id}')">
          <img src="${i.imageUrl}">
        </div>
      `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Erro ao renderizar itens:", error);
  }
}

function gerarCalendario() {
  const c = document.getElementById("calendar-list");
  if (!c) return;
  c.innerHTML = EVENTOS_ESCOLARES.map((ev) => {
    const d = new Date(ev.data + "T00:00:00");
    const dia = d.getDate();
    const mes = d.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase().replace(".", "");
    return `
      <div class="event-row">
        <div class="event-date">${dia}<br><small>${mes}</small></div>
        <div>
          <h4 style="margin:0; color: var(--primary);">${ev.titulo}</h4>
          <small style="color:var(--accent); text-transform: uppercase;">${ev.cat}</small>
        </div>
      </div>`;
  }).join("");
}

function renderGaleria() {
  const grid = document.getElementById("main-grid");
  if (!grid) return;
  let filtrados = allItems.filter((i) =>
    ["ATIVIDADES", "DESFILE", "EVENTOS", "INFRAESTRUTURA", "HOMENAGEM"].includes((i.category || "").toUpperCase()),
  );
  if (currentCat !== "TODAS") filtrados = filtrados.filter((i) => (i.category || "").toUpperCase() === currentCat);
  if (currentYear !== "TODOS") filtrados = filtrados.filter((i) => String(i.year) === String(currentYear));

  grid.innerHTML = filtrados.reverse().map((i) => `
    <div class="gallery-item">
      <img src="${i.imageUrl}" onclick="abrirImagemTelaCheia('${i.imageUrl}')" style="cursor: pointer;">
    </div>
  `).join("");
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

function toggleSelect(id) {
  itensSelecionados.has(id) ? itensSelecionados.delete(id) : itensSelecionados.add(id);
}

async function excluirSelecionados() {
  if (!itensSelecionados.size) return alert("Selecione um item para excluir.");
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return alert("Faça login para excluir itens.");
  try {
    for (const id of [...itensSelecionados]) {
      const res = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resolveUnauthorized(res)) {
        itensSelecionados.clear();
        renderAll();
        return;
      }
    }
    alert("Exclusão finalizada!");
  } catch (error) {
    console.error("Erro na exclusão:", error);
  }
  itensSelecionados.clear();
  renderAll();
}

function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none";
  });
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "block";
    el.classList.add("active");
  }
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-" + id)?.classList.add("active");
}

function setupYears() {
  let optsGallery = "<option value='TODOS'>Todos os Anos</option>";
  let optsUpload = "";
  for (let i = 2026; i >= 1970; i--) {
    optsGallery += `<option value='${i}'>${i}</option>`;
    optsUpload += `<option value='${i}'>${i}</option>`;
  }
  if (document.getElementById("year-selector")) document.getElementById("year-selector").innerHTML = optsGallery;
  if (document.getElementById("new-img-year")) document.getElementById("new-img-year").innerHTML = optsUpload;
}

function moveSlide(step) {
  const track = document.getElementById("track-home");
  if (!track) return;
  const slides = track.querySelectorAll("img");
  if (!slides || slides.length <= 1) return;
  currentSlide = (currentSlide + step + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function updateClock() {
  const c = document.getElementById("cal-clock");
  if (c) c.innerText = new Date().toLocaleTimeString("pt-BR");
}

function abrirImagemTelaCheia(url) {
  const modal = document.getElementById("modal-imagem");
  const modalImg = document.getElementById("modal-img-content");
  modal.classList.add("active");
  modalImg.src = url;
  document.body.style.overflow = "hidden";
}

function fecharModal() {
  const modal = document.getElementById("modal-imagem");
  if (modal) modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModal();
});
