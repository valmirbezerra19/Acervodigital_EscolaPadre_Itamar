const API_URL = "https://agile-cooperation-production.up.railway.app";
const ADMIN_TOKEN_KEY = "admin_token";

let currentSlide = 0;
let itensSelecionados = new Set();

// NOVAS VARIÁVEIS PARA A GALERIA
let allItems = [];
let currentCat = "TODAS";
let currentYear = "TODOS";

// ✅ CONSTANTE CORRIGIDA (SEM ERROS DE SINTAXE)
const EVENTOS_ESCOLARES = [
  { data: "2026-02-02", titulo: "Início das atividades dos Auxiliares de Serviços Gerais (A.S.G.)", cat: "administrativo" },
  { data: "2026-02-11", titulo: "Formação Continuada (Alfabetização e Planejamento)", cat: "pedagogico" },
  { data: "2026-02-19", titulo: "Início do Ano Letivo com Estudantes", cat: "letivo" },
  { data: "2026-04-02", titulo: "Aula no período matutino", cat: "letivo" },
  { data: "2026-04-11", titulo: "Dia da Família na Escola (Sábado)", cat: "comunidade" },
  { data: "2026-04-29", titulo: "Reunião de Pais - Educação Infantil (Matutino)", cat: "comunidade" },
  { data: "2026-04-30", titulo: "Pré-Conselho de Classe (Vespertino)", cat: "pedagogico" },

  // FERIADOS
  { data: "2026-01-01", titulo: "Confraternização Universal", cat: "feriado" },
  { data: "2026-02-16", titulo: "Carnaval (ponto facultativo)", cat: "feriado" },
  { data: "2026-02-17", titulo: "Carnaval", cat: "feriado" },
  { data: "2026-04-03", titulo: "Sexta-feira Santa", cat: "feriado" },
  { data: "2026-04-21", titulo: "Tiradentes", cat: "feriado" },
  { data: "2026-05-01", titulo: "Feriado: Dia do Trabalhador", cat: "feriado" },
  { data: "2026-06-04", titulo: "Feriado: Corpus Christi", cat: "feriado" },
  { data: "2026-08-27", titulo: "Feriado Municipal", cat: "feriado" },
  { data: "2026-09-07", titulo: "Independência do Brasil", cat: "feriado" },
  { data: "2026-10-12", titulo: "Padroeira do Brasil", cat: "feriado" },
  { data: "2026-11-02", titulo: "Finados", cat: "feriado" },
  { data: "2026-11-15", titulo: "Proclamação da República", cat: "feriado" },
  { data: "2026-12-25", titulo: "Natal", cat: "feriado" },

  // RESTANTE DOS EVENTOS
  { data: "2026-05-04", titulo: "Início do 2º Bimestre e Conselho de Classe Participativo", cat: "pedagogico" },
  { data: "2026-06-05", titulo: "Programa Escola Mais Verde: Visita à TRACTEBEL", cat: "projeto" },
  { data: "2026-06-24", titulo: "Feriado Municipal", cat: "feriado" },
  { data: "2026-06-29", titulo: "Projeto Semana Municipal de Pedro Raymundo / Festa Junina", cat: "projeto" },
  { data: "2026-06-30", titulo: "Projeto Semana Municipal de Pedro Raymundo / Festa Junina", cat: "projeto" },
  { data: "2026-07-23", titulo: "Reunião de Pais (Ed. Infantil Vespertino)", cat: "comunidade" },
  { data: "2026-07-24", titulo: "Conselho Participativo", cat: "pedagogico" },
  { data: "2026-07-27", titulo: "Recesso Escolar", cat: "recesso" },
  { data: "2026-07-31", titulo: "Recesso Escolar", cat: "recesso" },
  { data: "2026-08-03", titulo: "Início do 3º Bimestre", cat: "letivo" },
  { data: "2026-08-24", titulo: "Semana Cultural", cat: "cultural" },
  { data: "2026-08-28", titulo: "Ponto Facultativo", cat: "feriado" },
  { data: "2026-09-01", titulo: "Semana da Pátria", cat: "cultural" },
  { data: "2026-09-08", titulo: "Ponto Facultativo", cat: "feriado" },
  { data: "2026-09-14", titulo: "Início JEIMA", cat: "esportivo" },
  { data: "2026-09-18", titulo: "Término JEIMA", cat: "esportivo" },
  { data: "2026-09-28", titulo: "Reunião de Pais", cat: "comunidade" },
  { data: "2026-09-29", titulo: "Conselho Participativo", cat: "pedagogico" },
  { data: "2026-10-01", titulo: "Início do 4º Bimestre", cat: "letivo" },
  { data: "2026-10-05", titulo: "Visita ao Museu", cat: "projeto" },
  { data: "2026-10-07", titulo: "Cinema Cultural", cat: "projeto" },
  { data: "2026-10-09", titulo: "Dia da Criança", cat: "cultural" },
  { data: "2026-10-28", titulo: "Ponto Facultativo", cat: "feriado" },
  { data: "2026-11-19", titulo: "Feira de Ciências", cat: "projeto" },
  { data: "2026-12-01", titulo: "Abertura do Natal", cat: "cultural" },
  { data: "2026-12-09", titulo: "Formatura", cat: "pedagogico" },
  { data: "2026-12-10", titulo: "Pré-Conselho", cat: "pedagogico" },
  { data: "2026-12-11", titulo: "Encerramento com as crianças", cat: "letivo" },
  { data: "2026-12-14", titulo: "Conselho Final", cat: "pedagogico" },
  { data: "2026-12-15", titulo: "Encerramento Funcionários", cat: "administrativo" },
  { data: "2026-12-18", titulo: "Recesso Gestora", cat: "recesso" }
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
