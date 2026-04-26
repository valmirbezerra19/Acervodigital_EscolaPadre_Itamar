const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// Conexão automática usando a variável do Railway
mongoose.connect(process.env.MONGO_URL);

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", UserSchema);

// ROTA DE LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ success: true });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Falha na autenticação" });
    }
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Mantendo sua rota de itens anterior
app.post("/items", async (req, res) => {
  /* Seu código de upload aqui */
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
