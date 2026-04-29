const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Conexão com MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch(err => console.error("❌ Erro inicial MongoDB:", err));

// 2. Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do armazenamento de fotos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: "acervo-escola",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"]
  }
});
const upload = multer({ storage });

// 3. Modelos de Dados (Schemas)
const User = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}));

const Item = mongoose.model("Item", new mongoose.Schema({
  title: { type: String, default: "Sem título" },
  description: { type: String, default: "" },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true },
  year: { type: String, required: true },
  date: { type: Date, default: Date.now }
}));

// --- ROTAS ---

// Rota de Teste para verificar se o servidor está online
app.get("/", (req, res) => res.send("🚀 Servidor do Acervo Digital Ativo!"));

// Login de Administrador
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
  } catch (err) { 
    console.error("❌ Erro no login:", err);
    res.status(500).json({ success: false }); 
  }
});

// Buscar todos os itens (Galeria e Carrossel)
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar itens" });
  }
});

// ROTA DE UPLOAD CORRIGIDA PARA MOSTRAR ERRO REAL NO LOG
app.post("/items", upload.single("image"), async (req, res) => {
  try {
    // Verifica se o Multer conseguiu processar o arquivo
    if (!req.file) {
        console.error("❌ Erro: O servidor não recebeu o arquivo de imagem.");
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    // Cria o novo item com os dados do formulário e o link gerado pelo Cloudinary
    const newItem = new Item({
      title: req.body.title || "Foto Acervo",
      description: req.body.description || "",
      category: req.body.category,
      year: req.body.year,
      imageUrl: req.file.path // Caminho gerado automaticamente pelo Cloudinary
    });

    await newItem.save();
    console.log("✅ ITEM SALVO NO BANCO:", newItem.title);
    res.json(newItem);

  } catch (err) { 
    // AGORA OS LOGS VÃO MOSTRAR O ERRO EM TEXTO, NÃO MAIS [object Object]
    console.error("--- INÍCIO DO ERRO DETALHADO ---");
    console.error("Mensagem:", err.message);
    console.error("Detalhes completos:", JSON.stringify(err, null, 2));
    console.error("--- FIM DO ERRO ---");

    res.status(500).json({ 
        message: "Erro interno no upload", 
        detalhe: err.message 
    }); 
  }
});

// Configuração da Porta do Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
