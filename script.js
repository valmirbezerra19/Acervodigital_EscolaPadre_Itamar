const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
};

const API_URL = "https://agile-cooperation-production.up.railway.app";

let currentSlide = 0;
let itensSelecionados = new Set();

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
  const res = await fetch(`${API_URL}/items`);
  const data = await res.json();

  /* GALERIA */
  const grid = document.getElementById("main-grid");
  if (grid) {
    grid.innerHTML = data
      .filter(i =>
        ["ATIVIDADES","DESFILE","EVENTOS","INFRAESTRUTURA","HOMENAGEM"]
        .includes(i.category.toUpperCase())
      )
      .reverse()
      .map(i => `
        <div class="gallery-item">
          <img src="${i.imageUrl}">
        </div>
      `).join("");
  }

  /* CARROSSEL */
  const track = document.getElementById("track-home");
  if (track) {
    const slides = data
      .filter(i => i.category === "SLIDE (HOME)")
      .slice(-7);

    track.innerHTML = slides.length
      ? slides.map(s => `<img src="${s.imageUrl}">`).join("")
      : `<img src="escola.jpg">`;
  }

  /* LOGO */
  const logo = data.slice().reverse().find(i => i.category==="LOGO");
  if (logo) document.getElementById("main-logo-img").src = logo.imageUrl;

  /* FOTO SOBRE */
  const sobre = data.slice().reverse().find(i => i.category==="FOTO ESCOLA");
  if (sobre) document.getElementById("img-sobre-display").src = sobre.imageUrl;

  /* ADMIN GRID */
  const admin = document.getElementById("lista-admin");
  if (admin) {
    admin.innerHTML = data.map(i => `
      <div class="admin-item">
        <input type="checkbox" onchange="toggleSelect('${i._id}')">
        <img src="${i.imageUrl}">
      </div>
    `).join("");
  }

  /* CALENDÁRIO */
  const lista = document.getElementById("calendar-list");
  if (lista) {
    lista.innerHTML = EVENTOS_ESCOLARES.map(ev => {
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
  }
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
  el.style.display="block";
  el.classList.add("active");

  document.querySelectorAll(".nav-btn")
    .forEach(b=>b.classList.remove("active"));

  document.getElementById("btn-"+id)?.classList.add("active");
}

function setupYears(){
  let opts="";
  for(let i=2026;i>=1970;i--) opts+=`<option>${i}</option>`;
  document.getElementById("new-img-year").innerHTML = opts;
}

function moveSlide(step){
  const track=document.getElementById("track-home");
  const slides=track?.querySelectorAll("img");

  if(!slides||slides.length<=1) return;

  currentSlide=(currentSlide+step)%slides.length;
  track.style.transform=`translateX(-${currentSlide*100}%)`;
}

function updateClock(){
  const c=document.getElementById("cal-clock");
  if(c) c.innerText=new Date().toLocaleTimeString("pt-BR");
}
