// 2. Configuração do Cloudinary (Ajustada para compatibilidade)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: "acervo_escola", // Pasta sem hífens para evitar erros de sintaxe
    resource_type: "auto",
    public_id: (req, file) => `file_${Date.now()}` // Garante nome único para o arquivo
  }
});
const upload = multer({ storage });

// ... (Mantenha os modelos iguais) ...

// --- ROTAS AJUSTADAS ---

app.post("/items", upload.single("image"), async (req, res) => {
  try {
    console.log("Recebendo tentativa de upload...");
    
    if (!req.file) {
      console.log("❌ Arquivo não recebido pelo servidor.");
      return res.status(400).json({ error: "Arquivo de imagem não encontrado." });
    }

    console.log("☁️ Imagem enviada ao Cloudinary:", req.file.path);

    const newItem = new Item({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      year: req.body.year,
      imageUrl: req.file.path // O link gerado pelo Cloudinary
    });

    await newItem.save();
    console.log("✅ Sucesso: Item salvo no banco de dados!");
    res.json(newItem);

  } catch (err) { 
    // TRATAMENTO DE ERRO ROBUSTO PARA O LOG
    console.log("❌ ERRO NO PROCESSO:");
    console.error("Mensagem:", err.message);
    console.error("Stack:", err.stack);
    
    res.status(500).json({ 
      success: false, 
      error: err.message,
      detalhe: "Verifique se o Upload Preset está configurado no Cloudinary" 
    }); 
  }
});
