require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "acervo-test-jwt-secret-change-me";

const app = express();

// --- AJUSTE DE CORS ---
// --- AJUSTE DE CORS ---
app.use(
  cors({
    origin: "https://valmirbezerra19.github.io",
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

app.use(express.json());

// --- CONFIGURAÇÃO DO CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- CONFIGURAÇÃO DO STORAGE (ATUALIZADA PARA VÍDEOS) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "acervo_escola",
      upload_preset: "acervo_itamar",
      resource_type: "auto", // Permite detectar se é imagem ou vídeo automaticamente
      allowed_formats: [
        "jpg",
        "png",
        "jpeg",
        "gif",
        "webp",
        "mp4",
        "mov",
        "avi",
        "mkv",
      ],
    };
  },
});

// Middleware do Multer - Aumentado limite para 50MB para suportar vídeos
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).single("image");

// --- CONEXÃO COM O MONGODB ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

// --- MODELO DO ITEM ---
const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  year: String,
  imageUrl: String,
});
const Item = mongoose.model("Item", ItemSchema);

function requireAuth(req, res, next) {
  const hdr = req.headers.authorization;
  const token =
    hdr && hdr.startsWith("Bearer ") ? hdr.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
}

// --- ROTAS ---

app.get("/", (req, res) => res.send("Servidor Online!"));

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@escola.com" && password === "123456") {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.json({ success: true, token });
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

// Rota de Upload Reescrita para detalhar o erro no Railway
app.post("/items", requireAuth, (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error(
        "❌ ERRO DETALHADO NO CLOUDINARY/MULTER:",
        JSON.stringify(err, null, 2),
      );
      return res
        .status(500)
        .json({ success: false, error: err.message, details: err });
    }

    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "Arquivo não recebido pelo servidor." });
      }

      const newItem = new Item({
        title: req.body.title || "Sem título",
        description: req.body.description || "",
        category: req.body.category || "Geral",
        year: req.body.year || "2026",
        imageUrl: req.file.path,
      });

      await newItem.save();
      console.log("✅ Upload e salvamento realizados com sucesso!");
      res.json(newItem);
    } catch (dbErr) {
      console.error("❌ ERRO AO SALVAR NO MONGODB:", dbErr.message);
      res.status(500).json({ success: false, error: dbErr.message });
    }
  });
});

// Rota para deletar item
app.delete("/items/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Item.findByIdAndDelete(id);

    if (!deletedItem) {
      return res
        .status(404)
        .json({ error: "Item não encontrado no banco de dados." });
    }

    res.json({ success: true, message: "Item excluído com sucesso!" });
  } catch (err) {
    console.error("❌ ERRO AO DELETAR NO MONGODB:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
