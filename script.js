const CONFIG = {
  db: "AcervoPadreItamar_v12",
  store: "arquivos",
  cloud: "defxlhmma",
  preset: "acervo_itamar",
};

let db,
  currentSlide = 0,
  filtroCatAtual = "TODAS",
  filtroAnoAtual = "TODOS";

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
req.onupgradeneeded = (e) =>
  e.target.result.createObjectStore(CONFIG.store, { keyPath: "id" });
req.onsuccess = (e) => {
  db = e.target.result;
  init();
};

function init() {
  setupYears();
  renderAll();
  setInterval(() => moveSlide(1), 5000);
  setInterval(updateClock, 1000);

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const loginBox = document.getElementById("login-box");
      const adminPanel = document.getElementById("admin-panel");
      if (loginBox) loginBox.style.display = "none";
      if (adminPanel) adminPanel.style.display = "block";
      renderAll();
    }
  });
}

async function efetuarLogin() {
  const email = document.getElementById("adm-email").value;
  const pass = document.getElementById("adm-pass").value;
  const btn = document.getElementById("btn-login-action");
  if (!email || !pass) return alert("Preencha todos os campos");
  
  btn.innerText = "VERIFICANDO...";
  btn.disabled = true;
  try {
    await firebase.auth().signInWithEmailAndPassword(email, pass);
  } catch (error) {
    alert("Acesso Negado: E-mail ou senha incorretos.");
  } finally {
    btn.innerText = "ENTRAR";
    btn.disabled = false;
  }
}

function logout() {
  firebase.auth().signOut().then(() => location.reload());
}

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
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CONFIG.cloud}/image/upload`,
        { method: "POST", body: fd }
      );
      const d = await res.json();
      const tx = db.transaction(CONFIG.store, "readwrite");
      tx.objectStore(CONFIG.store).add({
        id: Date.now() + Math.random(),
        url: d.secure_url.replace("/upload/", "/upload/q_auto,f_auto/"),
        cat,
        ano,
      });
    } catch (e) {
      console.error("Erro no upload:", e);
    }
  }
  btn.innerText = "ENVIAR";
  btn.disabled = false;
  renderAll();
}

function renderAll() {
  if (!db) return;
  const tx = db.transaction(CONFIG.store, "readonly");
  tx.objectStore(CONFIG.store).getAll().onsuccess = (e) => {
    const data = e.target.result;

    const logo = data.filter((x) => x.cat === "LOGO").pop();
    if (logo) {
      const logoEl = document.getElementById("img-logo");
      if (logoEl) logoEl.src = logo.url;
    }

    const fav = data.filter((x) => x.cat === "FAVICON").pop();
    if (fav) {
      const link = document.querySelector("link[rel*='icon']");
      if (link) link.href = fav.url;
    }

    const sobre = data.filter((x) => x.cat === "FOTO SOBRE").pop();
    if (sobre) {
      const sobreEl = document.getElementById("img-sobre");
      if (sobreEl) sobreEl.src = sobre.url;
    }

    const grid = document.getElementById("main-grid");
    if (grid) {
      const catsGaleria = ["ATIVIDADES", "DESFILE", "EVENTOS", "INFRAESTRUTURA", "HOMENAGEM"];
      grid.innerHTML = data
        .filter((x) => catsGaleria.includes(x.cat))
        .filter((x) => filtroCatAtual === "TODAS" || x.cat === filtroCatAtual)
        .filter((x) => filtroAnoAtual === "TODOS" || x.ano === filtroAnoAtual)
        .reverse()
        .map(item => `
          <div class="gallery-item">
            <img src="${item.url}" loading="lazy" onclick="window.open('${item.url}')">
            <div style="padding:15px">
              <span class="badge-accent">${item.ano}</span>
              <p style="font-size:0.75rem; font-weight:600; color:#7f8c8d">${item.cat}</p>
            </div>
          </div>`).join("");
    }

    const track = document.getElementById("track-home");
    if (track) {
      const slides = data.filter((x) => x.cat === "SLIDE (HOME)");
      track.innerHTML = slides.length > 0
          ? slides.map((s) => `<img src="${s.url}">`).join("")
          : `<img src="escola.jpg">`;
    }

    // 6. Lista Administrativa (Atualizada com Clique para Ampliar)
    const adminList = document.getElementById("lista-admin");
    if (adminList) {
      adminList.innerHTML = data
        .sort((a, b) => b.id - a.id)
        .map(item => `
          <div class="admin-item">
            <input type="checkbox" class="delete-checkbox" data-id="${item.id}">
            <img src="${item.url}" 
                 onclick="window.open('${item.url}', '_blank')" 
                 title="Clique para ver em tamanho real">
            <div style="font-size:9px; text-align:center; background:#fff; padding:2px">
                ${item.cat} | ${item.ano}
            </div>
          </div>`).join("");
    }

    const calList = document.getElementById("calendar-list");
    if (calList) {
      calList.innerHTML = EVENTOS_ESCOLARES.map((ev) => {
        const d = new Date(ev.data + "T00:00:00");
        return `
          <div class="event-row">
            <div class="event-date">${d.getDate()}<br><small>${d.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase()}</small></div>
            <div>
              <h4 style="margin:0">${ev.titulo}</h4>
              <small style="color:var(--accent)">${ev.cat}</small>
            </div>
          </div>`;
      }).join("");
    }
  };
}

function updateClock() {
  const clock = document.getElementById("cal-clock");
  if (clock) clock.innerText = new Date().toLocaleTimeString("pt-BR");
}

function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const targetPage = document.getElementById(id);
  if (targetPage) targetPage.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const activeBtn = document.getElementById("btn-" + id);
  if (activeBtn) activeBtn.classList.add("active");

  window.scrollTo(0, 0);
  renderAll();
}

function setupYears() {
  let opts = "";
  for (let i = 2026; i >= 1970; i--) opts += `<option value="${i}">${i}</option>`;
  const selector = document.getElementById("year-selector");
  const newImgYear = document.getElementById("new-img-year");
  if (selector) selector.innerHTML = '<option value="TODOS">Todos os Anos</option>' + opts;
  if (newImgYear) newImgYear.innerHTML = opts;
}

function filtrarCat(cat, btn) {
  filtroCatAtual = cat;
  document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
  btn.classList.add("active");
  renderAll();
}

function filtrarAno(ano) {
  filtroAnoAtual = ano;
  renderAll();
}

function moveSlide(step) {
  const track = document.getElementById("track-home");
  const slides = track?.querySelectorAll("img");
  if (!slides || slides.length <= 1) return;
  currentSlide = (currentSlide + step + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}

async function excluirSelecionados() {
  const checkboxes = document.querySelectorAll(".delete-checkbox:checked");
  if (checkboxes.length === 0) return alert("Selecione itens para excluir.");
  if (!confirm(`Deseja excluir permanentemente os ${checkboxes.length} itens selecionados?`)) return;
  
  const tx = db.transaction(CONFIG.store, "readwrite");
  const store = tx.objectStore(CONFIG.store);
  
  checkboxes.forEach((cb) => {
    store.delete(parseFloat(cb.getAttribute("data-id")));
  });
  
  tx.oncomplete = () => {
    alert("Itens excluídos com sucesso!");
    renderAll();
  };
}
