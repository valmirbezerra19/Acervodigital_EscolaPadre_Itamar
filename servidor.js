require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DO CLOUDINARY ---
// Usando as chaves exatas que conferimos no seu painel do Railway
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- CONFIGURAÇÃO DO ARMAZENAMENTO (STORAGE) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: "acervo_escola",
    upload_preset: "acervo_itamar", // O preset que está Unsigned no seu Cloudinary
    resource_type: "auto",
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'], // Impede erros com formatos estranhos
    public_id: (req, file) => `file_${Date.now()}`
  }
});
const upload = multer({ storage });

// --- CONEXÃO COM O MONGODB ---
// Corrigido para MONGODB_URI (conforme configurado no Railway)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Conectado ao MongoDB"))
.catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// --- MODELO DO ITEM ---
const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  year: String,
  imageUrl: String
});
const Item = mongoose.model("Item", ItemSchema);

// --- ROTAS ---

// Rota de Teste
app.get("/", (req, res) => res.send("Servidor do Acervo está Online!"));

// Rota de Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@escola.com" && password === "123456") {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: "Credenciais inválidas" });
  }
});

// Rota de Listagem
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota de Upload de Itens
app.post("/items", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo de imagem recebido." });
    }

    const newItem = new Item({
      title: req.body.title || "Sem título",
      description: req.body.description || "",
      category: req.body.category || "Geral",
      year: req.body.year || "2026",
      imageUrl: req.file.path // URL segura retornada pelo Cloudinary
    });

    await newItem.save();
    res.json(newItem);
  } catch (err) { 
    console.error("Erro no processo de upload:", err.message);
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
