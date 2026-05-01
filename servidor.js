require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();

// --- AJUSTE DE CORS ---
// Liberando o seu domínio específico para evitar "Erro de conexão" no navegador
app.use(cors({
  origin: "https://valmirbezerra19.github.io"
}));

app.use(express.json());

// --- CONFIGURAÇÃO DO CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- CONFIGURAÇÃO DO STORAGE ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: "acervo_escola",
    upload_preset: "acervo_itamar", 
    resource_type: "auto",
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp']
  }
});
const upload = multer({ storage });

// --- CONEXÃO COM O MONGODB ---
// Usando a variável MONGODB_URI que configuramos no Railway
mongoose.connect(process.env.MONGODB_URI)
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

app.get("/", (req, res) => res.send("Servidor Online!"));

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@escola.com" && password === "123456") {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
});

app.get("/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota de Upload com Log de Erro Corrigido para JSON
app.post("/items", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não recebido pelo servidor." });
    }

    const newItem = new Item({
      title: req.body.title || "Sem título",
      description: req.body.description || "",
      category: req.body.category || "Geral",
      year: req.body.year || "2026",
      imageUrl: req.file.path 
    });

    await newItem.save();
    console.log("✅ Upload e salvamento realizados com sucesso!");
    res.json(newItem);
  } catch (err) { 
    // AGORA OS LOGS DO RAILWAY MOSTRARÃO O ERRO REAL EM TEXTO
    console.error("❌ ERRO DETALHADO NO UPLOAD:", JSON.stringify(err, null, 2));
    res.status(500).json({ success: false, error: err.message }); 
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
