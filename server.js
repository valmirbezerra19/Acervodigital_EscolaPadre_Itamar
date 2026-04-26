const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Garante que a pasta de uploads exista
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Configuração para salvar as imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Rota principal de teste
app.get("/", (req, res) => {
  res.send("✅ Backend do Acervo rodando com sucesso!");
});

// Rota para receber os dados do formulário e a imagem
app.post("/items", upload.single("imagem"), (req, res) => {
  const { nome, descricao } = req.body;
  const imagemUrl = req.file ? `/uploads/${req.file.filename}` : null;

  // Aqui você pode salvar em um banco de dados depois
  console.log("Recebido:", { nome, descricao, imagemUrl });

  res.status(201).json({
    message: "Item salvo com sucesso!",
    item: { nome, descricao, imagemUrl },
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
