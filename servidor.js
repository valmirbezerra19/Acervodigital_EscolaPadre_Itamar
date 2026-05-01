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
    upload_preset: "acervo_itamar", // O preset que conferimos no seu painel
    resource_type: "auto",
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp']
  }
});
const upload = multer({ storage });

// --- CONEXÃO COM O MONGODB ---
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
  const items = await Item.find();
  res.json(items);
});

// Rota de Upload com Log de Erro detalhado
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
    res.json(newItem);
  } catch (err) { 
    // CORREÇÃO PARA O LOG [object Object]:
    console.error("❌ ERRO DETALHADO NO UPLOAD:", JSON.stringify(err, null, 2));
    res.status(500).json({ success: false, error: err.message }); 
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
