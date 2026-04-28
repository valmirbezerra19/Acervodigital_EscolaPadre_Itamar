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

// 2. Configuração do Cloudinary (Usando suas variáveis do Railway)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: "acervo-escola" }
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
  date: { type: Date, default: Date.now }
}));

// --- ROTAS ---

// Rota de Teste (Para você ver se funcionou!)
app.get("/test-db", (req, res) => {
  res.send("✅ O servidor e o banco de dados estão conversando!");
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
  } catch (err) { res.status(500).json({ success: false }); }
});

// Buscar Itens (Galeria)
app.get("/items", async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

// Salvar Novo Item (Com Foto)
app.post("/items", upload.single("image"), async (req, res) => {
  try {
    const newItem = new Item({
      title: req.body.title,
      description: req.body.description,
      imageUrl: req.file.path // URL que vem do Cloudinary
    });
    await newItem.save();
    res.json(newItem);
  } catch (err) { res.status(500).send("Erro ao salvar item"); }
});

const PORT = process.env.PORT || 3000;
app.get("/criar-admin-inicial", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);
    const novoAdmin = new User({
      email: "admin@escola.com",
      password: hashedPassword
    });
    await novoAdmin.save();
    res.send("✅ Usuário administrador criado! E-mail: admin@escola.com | Senha: 123456");
  } catch (err) {
    res.status(500).send("Erro: " + err.message);
  }
});
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
