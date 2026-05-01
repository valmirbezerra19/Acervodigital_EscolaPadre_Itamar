// URL DA API NO RAILWAY
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
    fetchFotos(); // Busca dados do MongoDB
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

// BUSCAR DADOS DO MONGODB
async function fetchFotos() {
    try {
        const res = await fetch(API_URL);
        todasAsFotos = await res.json();
        renderAll();
    } catch (err) {
        console.error("Erro ao conectar com Railway/MongoDB:", err);
    }
}

// UPLOAD CLOUDINARY + SALVAR NO MONGODB
async function uploadCloudinary() {
    const files = document.getElementById("new-img-file").files;
    const cat = document.getElementById("new-img-cat").value;
    const ano = document.getElementById("new-img-year").value;
    const btn = document.getElementById("btn-upload");
    
    if (!files.length) return alert("Selecione fotos");
    
    btn.innerText = "ENVIANDO...";
    btn.disabled = true;

    for (let f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("upload_preset", CONFIG.preset);
        
        try {
            const resCloud = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.cloud}/image/upload`, { 
                method: "POST", 
                body: fd 
            });
            const d = await resCloud.json();
            
            // Salva no Backend Railway
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: d.secure_url.replace("/upload/", "/upload/q_auto,f_auto/"),
                    cat: cat,
                    ano: ano
                })
            });
        } catch (e) {
            console.error("Erro no processo:", e);
        }
    }
    
    btn.innerText = "ENVIAR";
    btn.disabled = false;
    fetchFotos();
}

// EXCLUSÃO MÚLTIPLA (CORREÇÃO PARA ex1.png)
async function excluirSelecionados() {
    // Seleciona os itens marcados pela classe específica
    const marcados = document.querySelectorAll(".delete-checkbox:checked");
    
    if (marcados.length === 0) {
        alert("Selecione os itens no painel para excluir");
        return;
    }
    
    if (!confirm(`Excluir ${marcados.length} foto(s)?`)) return;

    const btn = document.querySelector(".btn-danger-small");
    const originalText = btn.innerText;
    btn.innerText = "EXCLUINDO...";
    btn.disabled = true;

    try {
        for (let cb of marcados) {
            const id = cb.getAttribute("data-id"); // Pega o _id do MongoDB
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        }
        alert("Exclusão concluída com sucesso!");
    } catch (err) {
        console.error("Erro ao deletar do banco:", err);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        fetchFotos(); // Atualiza a lista
    }
}

// RENDERIZAÇÃO
function renderAll() {
    const data = todasAsFotos;
    
    // Lista Admin - Onde o ID do MongoDB é inserido no checkbox
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

    // Galeria Principal (Filtros de categoria e ano)
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
}

// (Mantenha as demais funções de login, slide e relógio como estão)
document.addEventListener("DOMContentLoaded", init);
