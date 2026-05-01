/**
 * SISTEMA DE ACERVO - PADRE ITAMAR
 * Integração: Railway (API) + MongoDB + Cloudinary
 */

const API_URL = "https://backend-acervo-production.up.railway.app/api/fotos"; 

const CONFIG = {
  cloud: "defxlhmma",
  preset: "acervo_itamar",
};

let todasAsFotos = [],
    currentSlide = 0,
    filtroCatAtual = "TODAS",
    filtroAnoAtual = "TODOS";

const EVENTOS_ESCOLARES = [
  { data: "2026-02-09", titulo: "Início do Ano Letivo", cat: "ACADÊMICO" },
  { data: "2026-06-20", titulo: "Festa Junina", cat: "EVENTO" },
  { data: "2026-09-07", titulo: "Desfile de Independência", cat: "CÍVICO" },
  { data: "2026-11-20", titulo: "Mostra Cultural 50 Anos", cat: "CULTURAL" }
];

// Inicialização
function init() {
  setupYears();
  fetchFotos(); 
  setInterval(() => moveSlide(1), 5000);
  setInterval(updateClock, 1000);

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      document.getElementById("login-box").style.display = "none";
      document.getElementById("admin-panel").style.display = "block";
      renderAll();
    }
  });
}

// BUSCAR DADOS NO MONGODB
async function fetchFotos() {
  try {
    const res = await fetch(API_URL);
    todasAsFotos = await res.json();
    renderAll();
  } catch (err) {
    console.error("Erro ao carregar banco do Railway:", err);
  }
}

// UPLOAD (CLOUDINARY -> MONGODB)
async function uploadCloudinary() {
  const files = document.getElementById("new-img-file").files;
  const cat = document.getElementById("new-img-cat").value;
  const ano = document.getElementById("new-img-year").value;
  const btn = document.getElementById("btn-upload");

  if (!files.length) return alert("Selecione fotos primeiro.");
  
  btn.innerText = "ENVIANDO...";
  btn.disabled = true;

  for (let f of files) {
    const fd = new FormData();
    fd.append("file", f);
    fd.append("upload_preset", CONFIG.preset);
    
    try {
      const resCloud = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.cloud}/image/upload`, { method: "POST", body: fd });
      const d = await resCloud.json();
      
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: d.secure_url.replace("/upload/", "/upload/q_auto,f_auto/"),
          cat: cat,
          ano: ano
        })
      });
    } catch (e) { console.error(e); }
  }
  
  btn.innerText = "ENVIAR";
  btn.disabled = false;
  fetchFotos();
}

// EXCLUIR SELECIONADOS (RESOLVE O ERRO DE SELEÇÃO)
async function excluirSelecionados() {
  const checkboxes = document.querySelectorAll(".delete-checkbox:checked");
  
  if (checkboxes.length === 0) {
    return alert("Marque os quadradinhos das fotos que deseja excluir.");
  }
  
  if (!confirm(`Excluir permanentemente ${checkboxes.length} item(s)?`)) return;

  const btn = document.querySelector(".btn-danger-small");
  btn.innerText = "EXCLUINDO...";
  btn.disabled = true;

  try {
    for (let cb of checkboxes) {
      const id = cb.getAttribute("data-id"); // Pega o _id do MongoDB
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    }
    alert("Exclusão concluída.");
  } catch (err) {
    console.error("Erro ao deletar:", err);
  } finally {
    btn.innerText = "Excluir";
    btn.disabled = false;
    fetchFotos();
  }
}

// RENDERIZAÇÃO COMPLETA
function renderAll() {
  const data = todasAsFotos;

  // Painel Admin (Onde o erro acontecia)
  const adminList = document.getElementById("lista-admin");
  if (adminList) {
    adminList.innerHTML = data
      .slice().reverse()
      .map(item => `
        <div class="admin-item">
          <input type="checkbox" class="delete-checkbox" data-id="${item._id}">
          <img src="${item.url}" onclick="window.open('${item.url}', '_blank')">
          <div style="font-size:9px; text-align:center; padding:2px">${item.ano}</div>
        </div>`).join("");
  }

  // Galeria Principal
  const grid = document.getElementById("main-grid");
  if (grid) {
    const catsGaleria = ["ATIVIDADES", "DESFILE", "EVENTOS", "INFRAESTRUTURA", "HOMENAGEM"];
    grid.innerHTML = data
      .filter(x => catsGaleria.includes(x.cat))
      .filter(x => filtroCatAtual === "TODAS" || x.cat === filtroCatAtual)
      .filter(x => filtroAnoAtual === "TODOS" || x.ano === filtroAnoAtual)
      .reverse()
      .map(item => `
        <div class="gallery-item">
          <img src="${item.url}" loading="lazy" onclick="window.open('${item.url}')">
          <div style="padding:15px">
            <span class="badge-accent">${item.ano}</span>
            <p style="font-size:0.75rem; font-weight:600">${item.cat}</p>
          </div>
        </div>`).join("");
  }

  // Slides e Logo
  const logo = data.filter(x => x.cat === "LOGO").pop();
  if (logo) document.getElementById("main-logo-img").src = logo.url;

  const track = document.getElementById("track-home");
  if (track) {
    const slides = data.filter(x => x.cat === "SLIDE");
    track.innerHTML = slides.length > 0 ? slides.map(s => `<img src="${s.url}">`).join("") : `<img src="escola.jpg">`;
  }
}

// Funções de Suporte (Slide, Clock, Filtros)
function moveSlide(step) {
  const track = document.getElementById("track-home");
  const slides = track?.querySelectorAll("img");
  if (!slides || slides.length <= 1) return;
  currentSlide = (currentSlide + step + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function updateClock() {
  const clock = document.getElementById("cal-clock");
  if (clock) clock.innerText = new Date().toLocaleTimeString("pt-BR");
}

function setupYears() {
  let opts = "";
  for (let i = 2026; i >= 1970; i--) opts += `<option value="${i}">${i}</option>`;
  if(document.getElementById("year-selector")) document.getElementById("year-selector").innerHTML = '<option value="TODOS">Todos os Anos</option>' + opts;
  if(document.getElementById("new-img-year")) document.getElementById("new-img-year").innerHTML = opts;
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
