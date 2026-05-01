const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
  cloud: "defxlhmma",
  preset: "acervo_itamar",
};

const API_URL = "https://agile-cooperation-production.up.railway.app";

let db, currentSlide = 0, filtroCatAtual = "TODAS", filtroAnoAtual = "TODOS";

const EVENTOS_ESCOLARES = [
  { data: "2026-02-09", titulo: "Início do Ano Letivo", cat: "ACADÊMICO" },
  { data: "2026-03-27", titulo: "Reunião Pedagógica", cat: "PEDAGÓGICO" },
  { data: "2026-05-10", titulo: "Homenagem Dia das Mães", cat: "SOCIAL" },
  { data: "2026-06-20", titulo: "Festa Junina", cat: "EVENTO" },
  { data: "2026-09-07", titulo: "Desfile de Independência", cat: "CÍVICO" },
  { data: "2026-11-20", titulo: "Mostra Cultural 50 Anos", cat: "CULTURAL" },
  { data: "2026-12-16", titulo: "Encerramento e Formatura", cat: "SOLENIDADE" },
];

const req = indexedDB.open(CONFIG.db, 1);
req.onupgradeneeded = (e) => e.target.result.createObjectStore(CONFIG.store, { keyPath: "id" });
req.onsuccess = (e) => { db = e.target.result; init(); };

function init() {
  setupYears();
  renderAll();
  setInterval(() => moveSlide(1), 5000);
  setInterval(updateClock, 1000);
}

async function efetuarLogin() {
  const email = document.getElementById("adm-email").value;
  const pass = document.getElementById("adm-pass").value;
  const btn = document.getElementById("btn-login-action");
  btn.innerText = "VERIFICANDO...";
  btn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    alert("Erro ao conectar com o servidor Railway.");
  } finally {
    btn.innerText = "ENTRAR";
    btn.disabled = false;
  }
}

function logout() { localStorage.removeItem("admin_logado"); location.reload(); }

async function uploadCloudinary() {
  const fileInput = document.getElementById("new-img-file");
  const cat = document.getElementById("new-img-cat").value;
  const ano = document.getElementById("new-img-year").value;
  const btn = document.getElementById("btn-upload");
  if (!fileInput.files.length) return alert("Selecione fotos");
  btn.innerText = "ENVIANDO...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);
  formData.append("title", `${cat} - ${ano}`);
  formData.append("description", `Categoria: ${cat}`);

  try {
    const res = await fetch(`${API_URL}/items`, { method: "POST", body: formData });
    if (res.ok) { alert("Foto enviada com sucesso!"); renderAll(); }
    else { alert("Erro no upload."); }
  } catch (e) { alert("Erro de conexão."); }
  finally { btn.innerText = "ENVIAR"; btn.disabled = false; }
}

async function renderAll() {
  try {
    const response = await fetch(`${API_URL}/items`);
    const data = await response.json();
    const grid = document.getElementById("main-grid");
    if (grid) {
      grid.innerHTML = data.reverse().map(item => `
          <div class="gallery-item">
            <img src="${item.imageUrl}" loading="lazy" onclick="window.open('${item.imageUrl}')">
            <div style="padding:15px"><p style="font-size:0.75rem; font-weight:600;">${item.title}</p></div>
          </div>`).join("");
    }
  } catch (err) { console.error("Erro ao carregar itens."); }
}

function updateClock() { 
  const clock = document.getElementById("cal-clock");
  if (clock) clock.innerText = new Date().toLocaleTimeString("pt-BR");
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  renderAll();
}

function setupYears() {
  let opts = "";
  for (let i = 2026; i >= 1970; i--) opts += `<option value="${i}">${i}</option>`;
  document.getElementById("year-selector").innerHTML = '<option value="TODOS">Todos os Anos</option>' + opts;
  document.getElementById("new-img-year").innerHTML = opts;
}

function moveSlide(step) {
  const track = document.getElementById("track-home");
  const slides = track?.querySelectorAll("img");
  if (!slides || slides.length <= 1) return;
  currentSlide = (currentSlide + step + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}
