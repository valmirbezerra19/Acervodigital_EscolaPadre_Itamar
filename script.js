const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
  cloud: "defxlhmma",
  preset: "acervo_itamar",
};

const API_URL = "https://agile-cooperation-production.up.railway.app";

let db,
  currentSlide = 0,
  filtroCatAtual = "TODAS",
  filtroAnoAtual = "TODOS",
  itensSelecionados = new Set();

const EVENTOS_ESCOLARES = [
  { data: "2026-02-09", titulo: "Início do Ano Letivo", cat: "ACADÊMICO" },
  { data: "2026-03-27", titulo: "Reunião Pedagógica", cat: "PEDAGÓGICO" },
  { data: "2026-05-10", titulo: "Homenagem Dia das Mães", cat: "SOCIAL" },
  { data: "2026-06-20", titulo: "Festa Junina", cat: "EVENTO" },
  { data: "2026-09-07", titulo: "Desfile de Independência", cat: "CÍVICO" },
  { data: "2026-11-20", titulo: "Mostra Cultural 50 Anos", cat: "CULTURAL" },
  { data: "2026-12-16", titulo: "Encerramento e Formatura", cat: "SOLENIDADE" },
];

// =========================
// INIT
// =========================
const req = indexedDB.open(CONFIG.db, 1);
req.onupgradeneeded = (e) =>
  e.target.result.createObjectStore(CONFIG.store, { keyPath: "id" });

req.onsuccess = (e) => {
  db = e.target.result;
  init();
};

function init() {
  setupYears();
  renderAll();
  showPage("home"); // 🔥 garante menu funcionando

  setInterval(() => moveSlide(1), 5000);
  setInterval(updateClock, 1000);
}

// =========================
// LOGIN
// =========================
async function efetuarLogin() {
  const email = document.getElementById("adm-email").value;
  const pass = document.getElementById("adm-pass").value;
  const btn = document.getElementById("btn-login-action");

  btn.innerText = "VERIFICANDO...";
  btn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password: pass }),
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById("login-box").style.display = "none";
      document.getElementById("admin-panel").style.display = "block";
      localStorage.setItem("admin_logado", "true");
      renderAll();
      alert("Login realizado com sucesso!");
    } else {
      alert("E-mail ou senha incorretos.");
    }
  } catch (error) {
    alert("Erro ao conectar com o servidor.");
  } finally {
    btn.innerText = "ENTRAR";
    btn.disabled = false;
  }
}

function logout() {
  localStorage.removeItem("admin_logado");
  location.reload();
}

// =========================
// UPLOAD
// =========================
async function uploadCloudinary() {
  const fileInput = document.getElementById("new-img-file");
  const cat = document.getElementById("new-img-cat").value;
  const ano = document.getElementById("new-img-year").value;
  const btn = document.getElementById("btn-upload");

  if (!fileInput.files.length) return alert("Selecione fotos");

  const file = fileInput.files[0];
  const maxSize = 50 * 1024 * 1024;

  if (file.size > maxSize) {
    alert("Arquivo maior que 50MB");
    fileInput.value = "";
    return;
  }

  btn.innerText = "ENVIANDO...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("category", cat);
  formData.append("year", ano);

  try {
    const res = await fetch(`${API_URL}/items`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("Upload realizado!");
      fileInput.value = "";
      renderAll();
    } else {
      alert("Erro no upload");
    }
  } catch (e) {
    alert("Erro de conexão");
  } finally {
    btn.innerText = "ENVIAR";
    btn.disabled = false;
  }
}

// =========================
// RENDER
// =========================
async function renderAll() {
  try {
    const response = await fetch(`${API_URL}/items`);
    const data = await response.json();

    // GALERIA
    const grid = document.getElementById("main-grid");
    if (grid) {
      grid.innerHTML = data
        .filter(i =>
          ["ATIVIDADES","DESFILE","EVENTOS","INFRAESTRUTURA","HOMENAGEM"]
          .includes(i.category.toUpperCase())
        )
        .reverse()
        .map(item => `
          <div class="gallery-item">
            <img src="${item.imageUrl}" onclick="window.open('${item.imageUrl}')">
            <div style="padding:10px">
              <p style="font-size:12px">${item.title}</p>
            </div>
          </div>
        `).join("");
    }

    // CARROSSEL (MAX 7)
    const track = document.getElementById("track-home");
    if (track) {
      const itensSlide = data
        .filter(i => i.category === "SLIDE (HOME)")
        .slice(-7);

      track.innerHTML =
        itensSlide.length > 0
          ? itensSlide.map(s => `<img src="${s.imageUrl}">`).join("")
          : `<img src="escola.jpg">`;
    }

    // LOGO
    const itemLogo = data.slice().reverse().find(i => i.category === "LOGO");
    const logoImg = document.getElementById("main-logo-img");
    if (logoImg && itemLogo) logoImg.src = itemLogo.imageUrl;

    // FOTO SOBRE
    const itemSobre = data.slice().reverse()
      .find(i => i.category === "FOTO ESCOLA");

    if (itemSobre) {
      document.getElementById("img-sobre-display").src =
        itemSobre.imageUrl;
    }

    // ADMIN GRID
    const adminList = document.getElementById("lista-admin");
    if (adminList) {
      adminList.innerHTML = data
        .slice()
        .reverse()
        .map(item => `
          <div class="admin-item">
            <input type="checkbox" onchange="toggleSelect('${item._id}')">
            <img src="${item.imageUrl}">
          </div>
        `).join("");
    }

  } catch (err) {
    console.error("Erro:", err);
  }

  // CALENDÁRIO (mantido)
  const calList = document.getElementById("calendar-list");
  if (calList) {
    calList.innerHTML = EVENTOS_ESCOLARES.map(ev => {
      const d = new Date(ev.data + "T00:00:00");
      return `
        <div class="event-row">
          <div class="event-date">${d.getDate()}<br><small>${d.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase()}</small></div>
          <div>
            <h4>${ev.titulo}</h4>
            <small>${ev.cat}</small>
          </div>
        </div>
      `;
    }).join("");
  }
}

// =========================
// MULTI SELECT
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

  if (!confirm("Excluir selecionados?")) return;

  try {
    await Promise.all(
      [...itensSelecionados].map(id =>
        fetch(`${API_URL}/items/${id}`, { method: "DELETE" })
      )
    );

    itensSelecionados.clear();
    renderAll();
  } catch {
    alert("Erro ao excluir");
  }
}

// =========================
// UTIL
// =========================
function updateClock() {
  const clock = document.getElementById("cal-clock");
  if (clock) clock.innerText = new Date().toLocaleTimeString("pt-BR");
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
    p.style.display = "none";
  });

  const page = document.getElementById(id);
  if (page) {
    page.style.display = "block";
    page.classList.add("active");
  }

  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.remove("active")
  );

  document.getElementById("btn-" + id)?.classList.add("active");
  window.scrollTo(0, 0);
}

function setupYears() {
  let opts = "";
  for (let i = 2026; i >= 1970; i--)
    opts += `<option value="${i}">${i}</option>`;

  const selector = document.getElementById("year-selector");
  const uploadSelector = document.getElementById("new-img-year");

  if (selector)
    selector.innerHTML = '<option value="TODOS">Todos</option>' + opts;

  if (uploadSelector) uploadSelector.innerHTML = opts;
}

function moveSlide(step) {
  const track = document.getElementById("track-home");
  const slides = track?.querySelectorAll("img");

  if (!slides || slides.length <= 1) return;

  currentSlide = (currentSlide + step + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}
