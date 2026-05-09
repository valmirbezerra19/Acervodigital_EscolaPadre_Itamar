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
  {
    data: "2026-02-02",
    titulo: "Início das atividades dos Auxiliares de Serviços Gerais (A.S.G.)",
    cat: "administrativo",
  },
  {
    data: "2026-02-11",
    titulo: "Formação Continuada (Alfabetização e Planejamento)",
    cat: "pedagogico",
  },
  {
    data: "2026-02-19",
    titulo: "Início do Ano Letivo com Estudantes",
    cat: "letivo",
  },
  { data: "2026-04-02", titulo: "Aula no período matutino", cat: "letivo" },
  {
    data: "2026-04-11",
    titulo: "Dia da Família na Escola (Sábado)",
    cat: "comunidade",
  },
  {
    data: "2026-04-29",
    titulo: "Reunião de Pais - Educação Infantil (Matutino)",
    cat: "comunidade",
  },
  {
    data: "2026-04-30",
    titulo: "Pré-Conselho de Classe (Vespertino)",
    cat: "pedagogico",
  },
  { data: "2026-05-01", titulo: "Feriado: Dia do Trabalhador", cat: "feriado" },
  {
    data: "2026-05-04",
    titulo: "Início do 2º Bimestre e Conselho de Classe Participativo",
    cat: "pedagogico",
  },
  { data: "2026-06-04", titulo: "Feriado: Corpus Christi", cat: "feriado" },
  {
    data: "2026-06-05",
    titulo: "Programa Escola Mais Verde: Visita à TRACTEBEL",
    cat: "projeto",
  },
  { data: "2026-06-24", titulo: "Feriado Municipal", cat: "feriado" },
  {
    data: "2026-06-29",
    titulo: "Projeto Semana Municipal de Pedro Raymundo / Festa Junina",
    cat: "projeto",
  },
  {
    data: "2026-06-30",
    titulo: "Projeto Semana Municipal de Pedro Raymundo / Festa Junina",
    cat: "projeto",
  },
  {
    data: "2026-07-23",
    titulo:
      "Reunião de Pais (Ed. Infantil Vespertino) e Pré-Conselho (1º ao 5º Matutino)",
    cat: "comunidade",
  },
  { data: "2026-07-24", titulo: "Conselho Participativo", cat: "pedagogico" },
  {
    data: "2026-07-27",
    titulo: "Recesso Escolar (Alunos e Professores)",
    cat: "recesso",
  },
  {
    data: "2026-07-31",
    titulo: "Recesso Escolar (Alunos e Professores)",
    cat: "recesso",
  },
  { data: "2026-08-03", titulo: "Início do 3º Bimestre", cat: "letivo" },
  {
    data: "2026-08-24",
    titulo: "Abertura da Semana do Município / Início da Semana Cultural",
    cat: "cultural",
  },
  {
    data: "2026-08-27",
    titulo: "Feriado: Aniversário de Emancipação de Imaruí",
    cat: "feriado",
  },
  { data: "2026-08-28", titulo: "Ponto Facultativo", cat: "feriado" },
  {
    data: "2026-09-01",
    titulo: "Abertura da Semana da Pátria nas escolas",
    cat: "cultural",
  },
  {
    data: "2026-09-07",
    titulo: "Desfile Cívico da Independência (Dia Letivo)",
    cat: "letivo",
  },
  { data: "2026-09-08", titulo: "Ponto Facultativo", cat: "feriado" },
  {
    data: "2026-09-14",
    titulo: "Início do JEIMA (Jogos Escolares de Imaruí)",
    cat: "esportivo",
  },
  { data: "2026-09-18", titulo: "Término do JEIMA", cat: "esportivo" },
  {
    data: "2026-09-28",
    titulo:
      "Reunião de Pais (Ed. Infantil Matutino) e Pré-Conselho (1º ao 5º Vespertino)",
    cat: "comunidade",
  },
  { data: "2026-09-29", titulo: "Conselho Participativo", cat: "pedagogico" },
  { data: "2026-10-01", titulo: "Início do 4º Bimestre", cat: "letivo" },
  {
    data: "2026-10-05",
    titulo: "Projeto: Visita ao Museu das Conchas (Itapirubá)",
    cat: "projeto",
  },
  {
    data: "2026-10-07",
    titulo: "Projeto: Conhecer o artista Willy Zumblick / Cinema",
    cat: "projeto",
  },
  {
    data: "2026-10-09",
    titulo: "Atividade especial do Dia da Criança (Noturno)",
    cat: "cultural",
  },
  {
    data: "2026-10-12",
    titulo: "Feriado: Padroeira do Brasil",
    cat: "feriado",
  },
  {
    data: "2026-10-28",
    titulo: "Ponto Facultativo (Todos os funcionários)",
    cat: "feriado",
  },
  {
    data: "2026-11-15",
    titulo: "Feriado: Proclamação da República",
    cat: "feriado",
  },
  {
    data: "2026-11-19",
    titulo: "Feira de Ciências: Inovação e Descoberta",
    cat: "projeto",
  },
  {
    data: "2026-12-01",
    titulo: "Abertura do Natal (Centro/Noturno)",
    cat: "cultural",
  },
  {
    data: "2026-12-09",
    titulo: "Conselho Participativo (Pré e 5º ano) e Formatura (Noturno)",
    cat: "pedagogico",
  },
  {
    data: "2026-12-10",
    titulo: "Pré-Conselho (Vespertino)",
    cat: "pedagogico",
  },
  { data: "2026-12-11", titulo: "Encerramento com as crianças", cat: "letivo" },
  {
    data: "2026-12-14",
    titulo: "Conselho de Classe Participativo",
    cat: "pedagogico",
  },
  {
    data: "2026-12-15",
    titulo: "Encerramento (Funcionários Efetivos)",
    cat: "administrativo",
  },
  { data: "2026-12-18", titulo: "Recesso da Equipe Gestora", cat: "recesso" },
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

    const logo = data
      .slice()
      .reverse()
      .find((i) => i.category === "LOGO");
    if (logo && document.getElementById("main-logo-img"))
      document.getElementById("main-logo-img").src = logo.imageUrl;

    const sobre = data
      .slice()
      .reverse()
      .find((i) => i.category === "SOBRE" || i.category === "FOTO ESCOLA");
    if (sobre && document.getElementById("img-sobre-display"))
      document.getElementById("img-sobre-display").src = sobre.imageUrl;

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
    const mes = d
      .toLocaleDateString("pt-BR", { month: "short" })
      .toUpperCase()
      .replace(".", "");
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
    [
      "ATIVIDADES",
      "DESFILE",
      "EVENTOS",
      "INFRAESTRUTURA",
      "HOMENAGEM",
    ].includes((i.category || "").toUpperCase()),
  );
  if (currentCat !== "TODAS")
    filtrados = filtrados.filter(
      (i) => (i.category || "").toUpperCase() === currentCat,
    );
  if (currentYear !== "TODOS")
    filtrados = filtrados.filter((i) => String(i.year) === String(currentYear));

  grid.innerHTML = filtrados
    .reverse()
    .map(
      (i) => `
    <div class="gallery-item">
      <img src="${i.imageUrl || i.url}" onclick="abrirImagemTelaCheia('${i.imageUrl || i.url}')" style="cursor: pointer;">
      <div class="card-info">
        <!--Trocamos ano por year e cat category -->
        <span class="badge-year">${i.year || "2026"}</span>
        <p class="category-name">${i.category || "GERAL"}</p>
      </div>
    </div>
  `,
    )
    .join("");
}

function filtrarCat(cat, btn) {
  currentCat = cat.toUpperCase();
  if (btn) {
    document
      .querySelectorAll(".filter-pills .pill")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
  }
  renderGaleria();
}

function filtrarAno(ano) {
  currentYear = ano;
  renderGaleria();
}

function toggleSelect(id) {
  itensSelecionados.has(id)
    ? itensSelecionados.delete(id)
    : itensSelecionados.add(id);
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
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-" + id)?.classList.add("active");
}

function setupYears() {
  let optsGallery = "<option value='TODOS'>Todos os Anos</option>";
  let optsUpload = "";
  for (let i = 2026; i >= 1970; i--) {
    optsGallery += `<option value='${i}'>${i}</option>`;
    optsUpload += `<option value='${i}'>${i}</option>`;
  }
  if (document.getElementById("year-selector"))
    document.getElementById("year-selector").innerHTML = optsGallery;
  if (document.getElementById("new-img-year"))
    document.getElementById("new-img-year").innerHTML = optsUpload;
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
