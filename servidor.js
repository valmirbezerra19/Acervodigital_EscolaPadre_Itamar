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
  .catch(err => console.error("❌ Erro MongoDB:", err));

// 2. Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: "acervo-escola",
    allowed_formats: ["jpg", "png", "jpeg", "gif"]
  }
});
const upload = multer({ storage });

// 3. Modelos de Dados
const User = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}));

const Item = mongoose.model("Item", new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  category: String,
  year: String,
  date: { type: Date, default: Date.now }
}));

// --- ROTAS ---

// Rota de Teste
app.get("/test-db", (req, res) => {
  res.send("✅ O servidor está ativo!");
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Erro de login" });
    }
  } catch (err) { 
    console.error("Erro no login:", err);
    res.status(500).json({ success: false }); 
  }
});

// Buscar Itens (Galeria)
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).send("Erro ao buscar itens");
  }
});

// Salvar Novo Item (Com Foto) - AQUI ESTÁ A CORREÇÃO DO LOG
app.post("/items", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
        return res.status(400).send("Nenhuma imagem foi enviada.");
    }

    const newItem = new Item({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      year: req.body.year,
      imageUrl: req.file.path
    });

    await newItem.save();
    console.log("✅ Item salvo com sucesso:", newItem.title);
    res.json(newItem);
  } catch (err) { 
    // Esta linha abaixo vai mostrar o erro real no Railway agora!
    console.error("❌ ERRO DETALHADO NO UPLOAD:", err); 
    res.status(500).json({ 
        message: "Erro ao salvar item", 
        detalhe: err.message 
    }); 
  }
});

// Porta do Servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
