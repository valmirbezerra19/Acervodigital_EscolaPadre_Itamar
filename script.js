/**
 * PROJETO: ACERVO PADRE ITAMAR
 * AMBIENTE: PRODUÇÃO (RAILWAY + CLOUDINARY)
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

// INICIALIZAÇÃO
function init() {
    setupYears();
    fetchFotos(); // Busca do MongoDB
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

// BUSCAR DADOS (GET)
async function fetchFotos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Erro na rede");
        todasAsFotos = await res.json();
        renderAll();
    } catch (err) {
        console.error("Falha ao carregar API Railway:", err);
    }
}

// UPLOAD (POST)
async function uploadCloudinary() {
    const files = document.getElementById("new-img-file").files;
    const cat = document.getElementById("new-img-cat").value;
    const ano = document.getElementById("new-img-year").value;
    const btn = document.getElementById("btn-upload");

    if (!files.length) return alert("Por favor, selecione as imagens.");
    
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
        } catch (e) { console.error("Erro no upload individual:", e); }
    }
    
    btn.innerText = "ENVIAR";
    btn.disabled = false;
    fetchFotos(); // Recarrega do banco
}

// EXCLUIR (DELETE) - RESOLVE O ERRO DA IMAGEM ex1.png
async function excluirSelecionados() {
    const checkboxes = document.querySelectorAll(".delete-checkbox:checked");
    
    if (checkboxes.length === 0) {
        alert("Erro: Você deve marcar as fotos que deseja excluir.");
        return;
    }
    
    if (!confirm(`Deseja realmente excluir ${checkboxes.length} item(s)?`)) return;

    const btn = document.querySelector(".btn-danger-small");
    btn.innerText = "EXCLUINDO...";
    btn.disabled = true;

    try {
        for (let cb of checkboxes) {
            const id = cb.getAttribute("data-id"); // Pega o _id do MongoDB
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        }
        alert("Exclusão realizada com sucesso no MongoDB!");
    } catch (err) {
        console.error("Erro ao deletar:", err);
    } finally {
        btn.innerText = "Excluir";
        btn.disabled = false;
        fetchFotos();
    }
}

// RENDERIZAÇÃO
function renderAll() {
    const data = todasAsFotos;

    // Admin
    const adminList = document.getElementById("lista-admin");
    if (adminList) {
        adminList.innerHTML = data.slice().reverse().map(item => `
            <div class="admin-item">
                <input type="checkbox" class="delete-checkbox" data-id="${item._id}">
                <img src="${item.url}">
                <div>${item.cat} | ${item.ano}</div>
            </div>`).join("");
    }

    // Galeria
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
                        <span class="btn-primary" style="padding:2px 8px; font-size:10px">${item.ano}</span>
                        <p style="margin-top:8px; font-weight:bold">${item.cat}</p>
                    </div>
                </div>`).join("");
    }

    // Slide
    const track = document.getElementById("track-home");
    if (track) {
        const slides = data.filter(x => x.cat === "SLIDE");
        track.innerHTML = slides.length > 0 ? slides.map(s => `<img src="${s.url}">`).join("") : `<img src="escola.jpg">`;
    }
}

// SUPORTE
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

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
    window.scrollTo(0,0);
    renderAll();
}

function setupYears() {
    let opts = "";
    for (let i = 2026; i >= 1970; i--) opts += `<option value="${i}">${i}</option>`;
    if(document.getElementById("year-selector")) document.getElementById("year-selector").innerHTML = '<option value="TODOS">Todos</option>' + opts;
    if(document.getElementById("new-img-year")) document.getElementById("new-img-year").innerHTML = opts;
}

document.addEventListener("DOMContentLoaded", init);
