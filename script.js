<!doctype html>
<html lang="pt-br">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Acervo Digital | Padre Itamar</title>

<link rel="stylesheet" href="style.css" />
<link rel="icon" type="image/png" href="img/logo.png" />

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>

</head>

<body>

<header class="glass-header">
<nav class="container nav-wrapper">

<div class="logo-area" onclick="showPage('home')">
<div class="logo-circle">
<img src="img/logo.png" id="main-logo-img">
</div>
<div class="brand-text">
<h1>ACERVO <span>DIGITAL</span></h1>
<p>E.E.F.M Padre Itamar Luiz da Costa</p>
</div>
</div>

<div class="nav-menu">
<button onclick="showPage('home')" class="nav-btn active" id="btn-home">INÍCIO</button>
<button onclick="showPage('galeria')" class="nav-btn" id="btn-galeria">GALERIA</button>
<button onclick="showPage('calendario')" class="nav-btn" id="btn-calendario">CALENDÁRIO</button>
<button onclick="showPage('sobre')" class="nav-btn" id="btn-sobre">SOBRE</button>
<button onclick="showPage('login')" class="admin-icon"><i class="fas fa-shield-alt"></i></button>
</div>

</nav>
</header>

<main class="main-content">

<!-- HOME -->
<section id="home" class="page active">
<div class="container">

<div class="carousel-wrapper glass-card">
<div class="carousel-track" id="track-home"></div>
</div>

<div class="home-cards-grid">
<div class="glass-card clickable-card" onclick="showPage('galeria')">
<i class="fas fa-landmark"></i>
<h3>Patrimônio Histórico</h3>
</div>

<div class="glass-card clickable-card" onclick="showPage('calendario')">
<i class="fas fa-graduation-cap"></i>
<h3>Calendário Escolar</h3>
</div>

<div class="glass-card clickable-card" onclick="showPage('sobre')">
<i class="fas fa-users"></i>
<h3>Nossa História</h3>
</div>
</div>

</div>
</section>

<!-- GALERIA -->
<section id="galeria" class="page container">
<div class="elegant-grid" id="main-grid"></div>
</section>

<!-- CALENDARIO -->
<section id="calendario" class="page container">
<div id="calendar-list"></div>
</section>

<!-- SOBRE -->
<section id="sobre" class="page container">
<div class="glass-card">
<img id="img-sobre-display" src="escola.jpg" style="width:100%;border-radius:15px;">
</div>
</section>

<!-- ADMIN -->
<section id="login" class="page container">

<div id="login-box" class="glass-card">
<input id="adm-email" placeholder="email">
<input id="adm-pass" type="password" placeholder="senha">
<button onclick="efetuarLogin()" class="btn-primary">ENTRAR</button>
</div>

<div id="admin-panel" style="display:none">

<button onclick="alterarMinhaSenha()" class="btn-admin">MUDAR SENHA</button>
<button onclick="cadastrarNovoAdmin()" class="btn-admin">NOVO USUÁRIO</button>
<button onclick="logout()" class="btn-admin">SAIR</button>

<div class="glass-card">
<input type="file" id="new-img-file" multiple>

<select id="new-img-cat">
<option value="SLIDE (HOME)">SLIDE (HOME)</option>
<option value="LOGO">LOGO</option>
<option value="FOTO ESCOLA">FOTO ESCOLA</option>
</select>

<select id="new-img-year"></select>

<button onclick="uploadCloudinary()" class="btn-primary">ENVIAR</button>
</div>

<button onclick="excluirSelecionados()" class="btn-admin">EXCLUIR</button>

<div id="lista-admin" class="admin-grid-selection"></div>

</div>

</section>

</main>

<footer class="footer-modern">
<div class="container footer-grid">

<div>
<h3>ESCOLA PADRE ITAMAR</h3>
<p>Imaruí - SC</p>
<p>Desenvolvido por Valmir Ap. Bezerra</p>
</div>

<div>
<a href="https://wa.me/5548998118259"><i class="fab fa-whatsapp"></i></a>
</div>

</div>
</footer>

<script src="script.js"></script>
</body>
</html>
