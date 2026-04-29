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
  .then(async () => {
    console.log("✅ Conectado ao MongoDB");
    // CRIAÇÃO AUTOMÁTICA DO ADMIN
    try {
      const hashPassword = await bcrypt.hash("123456", 10);
      const jaExiste = await mongoose.model("User").findOne({ email: "admin@escola.com" });
      if (!jaExiste) {
        await mongoose.model("User").create({ email: "admin@escola.com", password: hashPassword });
        console.log("👤 Usuário Admin criado: admin@escola.com / 123456");
      }
    } catch (e) { console.log("Nota: Admin já configurado."); }
  })
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

// 3. Modelos
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

app.get("/", (req, res) => res.send("Servidor Online"));

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Usuário ou senha incorretos" });
    }
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get("/items", async (req, res) => {
  const items = await Item.find().sort({ date: -1 });
  res.json(items);
});

app.post("/items", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Sem imagem.");
    const newItem = new Item({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      year: req.body.year,
      imageUrl: req.file.path
    });
    await newItem.save();
    console.log("✅ Item salvo!");
    res.json(newItem);
  } catch (err) { 
    console.error("❌ ERRO DETALHADO:", JSON.stringify(err, null, 2));
    res.status(500).json({ error: err.message }); 
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
