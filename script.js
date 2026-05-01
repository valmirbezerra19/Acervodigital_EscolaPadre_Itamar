// CONFIGURAÇÕES GLOBAIS
const API_URL = "https://backend-acervo-production.up.railway.app/api/fotos"; 
const CLOUD_CONFIG = { cloud: "defxlhmma", preset: "acervo_itamar" };

let todasAsFotos = [],
    currentSlide = 0,
    filtroCatAtual = "TODAS",
    filtroAnoAtual = "TODOS";

// INICIALIZAÇÃO COMPLETA
function init() {
    setupYears();
    fetchFotos(); // Busca dados do MongoDB via Railway
    setInterval(() => moveSlide(1), 5000); // Slide Automático
    setInterval(updateClock, 1000); // Relógio em tempo real

    // Observador do Firebase para Login
    firebase.auth().onAuthStateChanged((user) => {
        const loginBox = document.getElementById("login-box");
        const adminPanel = document.getElementById("admin-panel");
        if (user) {
            if(loginBox) loginBox.style.display = "none";
            if(adminPanel) adminPanel.style.display = "block";
            renderAll();
        } else {
            if(loginBox) loginBox.style.display = "block";
            if(adminPanel) adminPanel.style.display = "none";
        }
    });
}

// BUSCAR DADOS DA API
async function fetchFotos() {
    try {
        const res = await fetch(API_URL);
        todasAsFotos = await res.json();
        renderAll();
    } catch (err) {
        console.error("Erro na API Railway:", err);
    }
}

// NAVEGAÇÃO ENTRE PÁGINAS (RESTUARADA)
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
    
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("btn-" + id)?.classList.add("active");
    
    window.scrollTo(0, 0);
    renderAll();
}

// RENDERIZAÇÃO DE TODAS AS SEÇÕES
function renderAll() {
    const data = todasAsFotos;

    // 1. Logo e Sobre
    const logo = data.filter(x => x.cat === "LOGO").pop();
    if (logo && document.getElementById("main-logo-img")) {
        document.getElementById("main-logo-img").src = logo.url;
    }

    // 2. Galeria Pública
    const grid = document.getElementById("main-grid");
    if (grid) {
        const catsGaleria = ["ATIVIDADES", "DESFILE", "EVENTOS", "INFRAESTRUTURA", "HOMENAGEM"];
        grid.innerHTML = data
            .filter(x => catsGaleria.includes(x.cat))
            .filter(x => filtroCatAtual === "TODAS" || x.cat === filtroCatAtual)
            .filter(x => filtroAnoAtual === "TODOS" || x.ano === filtroAnoAtual)
            .reverse()
            .map(item => `
                <div class="gallery-item" onclick="window.open('${item.url}', '_blank')">
                    <img src="${item.url}" loading="lazy">
                    <div style="padding:15px">
                        <span style="font-size:12px; background:#3498db; color:white; padding:2px 8px; border-radius:4px">${item.ano}</span>
                        <p style="font-weight:bold; margin-top:5px">${item.cat}</p>
                    </div>
                </div>`).join("");
    }

    // 3. Painel Admin (Seleção para Excluir)
    const adminList = document.getElementById("lista-admin");
    if (adminList) {
        adminList.innerHTML = data.slice().reverse().map(item => `
            <div class="admin-item">
                <input type="checkbox" class="delete-checkbox" data-id="${item._id}">
                <img src="${item.url}">
                <div style="font-size:9px; text-align:center">${item.cat} | ${item.ano}</div>
            </div>`).join("");
    }

    // 4. Slides
    const track = document.getElementById("track-home");
    if (track) {
        const slides = data.filter(x => x.cat === "SLIDE");
        track.innerHTML = slides.length > 0 ? slides.map(s => `<img src="${s.url}">`).join("") : `<img src="escola.jpg">`;
    }
}

// EXCLUIR DO MONGODB (CORRIGIDO)
async function excluirSelecionados() {
    const selecionados = document.querySelectorAll(".delete-checkbox:checked");
    if (selecionados.length === 0) return alert("Selecione fotos para excluir.");
    
    if (!confirm("Excluir permanentemente do banco de dados?")) return;

    for (let cb of selecionados) {
        const id = cb.getAttribute("data-id");
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    }
    fetchFotos();
}

// UPLOAD (CLOUDINARY + RAILWAY)
async function uploadCloudinary() {
    const files = document.getElementById("new-img-file").files;
    const cat = document.getElementById("new-img-cat").value;
    const ano = document.getElementById("new-img-year").value;
    const btn = document.getElementById("btn-upload");

    if (!files.length) return alert("Selecione fotos.");
    btn.disabled = true; btn.innerText = "ENVIANDO...";

    for (let f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("upload_preset", CLOUD_CONFIG.preset);
        
        const resCloud = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_CONFIG.cloud}/image/upload`, { method: "POST", body: fd });
        const d = await resCloud.json();
        
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: d.secure_url, cat, ano })
        });
    }
    btn.disabled = false; btn.innerText = "ENVIAR";
    fetchFotos();
}

// FUNÇÕES DE APOIO
function updateClock() {
    const clock = document.getElementById("cal-clock");
    if (clock) clock.innerText = new Date().toLocaleTimeString("pt-BR");
}

function moveSlide(step) {
    const track = document.getElementById("track-home");
    const slides = track?.querySelectorAll("img");
    if (!slides || slides.length <= 1) return;
    currentSlide = (currentSlide + step + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function setupYears() {
    let opts = "";
    for (let i = 2026; i >= 1970; i--) opts += `<option value="${i}">${i}</option>`;
    const s1 = document.getElementById("year-selector");
    const s2 = document.getElementById("new-img-year");
    if(s1) s1.innerHTML = '<option value="TODOS">Todos os Anos</option>' + opts;
    if(s2) s2.innerHTML = opts;
}

// LOGIN FIREBASE
async function efetuarLogin() {
    const email = document.getElementById("adm-email").value;
    const pass = document.getElementById("adm-pass").value;
    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (e) { alert("Erro de acesso."); }
}

function logout() { firebase.auth().signOut().then(() => location.reload()); }

document.addEventListener("DOMContentLoaded", init);
