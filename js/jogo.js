/* IMPULSO EM CARTAZ — motor do jogo, telas e arquivo de partidas.
   Tudo fica no navegador de quem joga: nao existe login, servidor nem conta. */
(function (global) {
  "use strict";

  var CFG = global.CARTAZ_CONFIG;
  var PIADAS = global.CARTAZ_PIADAS;
  var U = global.U, CAL = global.CAL, IMG = global.IMG;

  var CHAVE_PARTIDAS = "cartaz.v1.partidas";
  var CHAVE_VISITA = "cartaz.v1.visitou";

  var partidas = U.ler(CHAVE_PARTIDAS, {});
  var HOJE = CAL.hoje();
  var estado = { dia: HOJE, sessao: null, marcada: -1, sugestoes: [] };

  var EMOJI    = ["🟩", "🟨", "🟧", "🟥"]; /* verde, amarelo, laranja, vermelho */
  var EMOJI_ERRO = "⬛";

  var NOMES_CATEGORIA = {
    "hollywood-classico": "Hollywood clássico",
    "hollywood-moderno": "Hollywood moderno",
    "nacional": "Cinema brasileiro",
    "europeu": "Cinema europeu",
    "mundo": "Cinema mundial",
    "vanguarda": "Vanguarda / experimental",
    "animacao": "Animação",
    "documentario": "Documentário"
  };

  /* ================= utilidades de tela ================= */

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function mostrar(qual) {
    ["sessoes", "jogo", "revelacao", "fim", "cinemateca"].forEach(function (t) {
      $("tela-" + t).classList.toggle("oculto", t !== qual);
    });
    global.scrollTo({ top: 0, behavior: "smooth" });
  }

  function modal(html) {
    var raiz = $("modal-raiz");
    raiz.innerHTML =
      '<div class="fundo-modal"><div class="modal">' +
      '<button class="fechar" aria-label="Fechar">&times;</button>' + html +
      "</div></div>";
    function fechar() { raiz.innerHTML = ""; }
    raiz.querySelector(".fechar").onclick = fechar;
    raiz.querySelector(".fundo-modal").onclick = function (e) {
      if (e.target === this) fechar();
    };
    return fechar;
  }

  /* ================= arquivo de partidas ================= */

  function chave(dia, sessao) { return dia + "-" + sessao; }

  function partida(dia, sessao, criar) {
    var k = chave(dia, sessao);
    if (!partidas[k] && criar) {
      var filmes = CAL.filmesDoDia(dia)[sessao];
      partidas[k] = {
        dia: dia, sessao: sessao, atual: 0, fim: false, ts: Date.now(),
        itens: filmes.map(function (f) {
          return { id: f.id, erros: [], acertou: false, pulou: false, pontos: 0, fim: false };
        })
      };
      salvar();
    }
    return partidas[k];
  }

  function salvar() { U.gravar(CHAVE_PARTIDAS, partidas); }

  function pontosDa(p) {
    return p.itens.reduce(function (s, i) { return s + i.pontos; }, 0);
  }
  function situacao(dia, sessao) {
    var p = partidas[chave(dia, sessao)];
    if (!p) return "nova";
    return p.fim ? "fim" : "andamento";
  }
  function sessao2Liberada(dia) {
    if (CFG.liberacaoSessao2 === "hora") {
      if (dia < HOJE) return true;
      return new Date().getHours() >= CFG.liberaSessao2Hora;
    }
    return situacao(dia, 1) === "fim";
  }

  /* ================= tela: sessoes do dia ================= */

  function faixaArquivo() {
    var f = $("faixa-arquivo");
    if (estado.dia === HOJE) { f.classList.add("oculto"); return; }
    var d = U.dataDoDia(CFG.dataInicio, estado.dia);
    f.classList.remove("oculto");
    f.innerHTML = '<span>Você está na <b>Cinemateca</b> — dia ' + estado.dia +
      ", " + U.dataPorExtenso(d) + '.</span><button id="voltar-hoje">ir para hoje</button>';
    $("voltar-hoje").onclick = function () { estado.dia = HOJE; telaSessoes(); };
  }

  function telaSessoes() {
    faixaArquivo();
    var d = U.dataDoDia(CFG.dataInicio, estado.dia);
    var html =
      '<div class="abertura">' +
      '<p class="apresenta">A Impulso Filmes apresenta</p>' +
      '<div class="marquise"><div class="painel">' +
      "<h1>Em Cartaz</h1>" +
      '<p class="data">Dia ' + estado.dia + " · " + U.dataCurta(d) + "</p>" +
      "</div></div>" +
      '<p class="apresentacao">Reconhecer um filme pelo cartaz é fácil. ' +
      "Com quatorze quadradinhos, nem tanto. <b>Oito por dia, em duas sessões</b> — " +
      "quatro tentativas cada, e a imagem só clareia quando você erra.</p></div>" +
      '<div class="lista-sessoes">';

    CFG.sessoes.forEach(function (s, i) {
      var st = situacao(estado.dia, s.id);
      var liberada = s.id === 1 || sessao2Liberada(estado.dia);
      var p = partidas[chave(estado.dia, s.id)];
      var carimbo = "";
      if (st === "fim") carimbo = '<span class="carimbo ok">' + pontosDa(p) + "/16</span>";
      else if (st === "andamento") carimbo = '<span class="carimbo andamento">em andamento</span>';
      else if (!liberada) carimbo = '<span class="carimbo fechada">fechada</span>';

      var recado = liberada
        ? (st === "fim" ? "Sessão encerrada — dá pra rever o resultado." : s.abertura)
        : (CFG.liberacaoSessao2 === "hora"
          ? "Abre às " + CFG.liberaSessao2Hora + "h."
          : "Abre quando você terminar a " + CFG.sessoes[0].nome + ".");

      html +=
        '<button class="ingresso ' + (i === 0 ? "matine" : "meianoite") +
        (carimbo ? " com-carimbo" : "") + '" data-sessao="' + s.id + '"' +
        (liberada ? "" : " disabled") + ">" +
        '<span class="furo cima"></span><span class="furo baixo"></span>' + carimbo +
        '<span class="corpo">' +
        '<span class="etiqueta">Impulso em Cartaz</span>' +
        '<span class="nome">' + esc(s.nome) + "</span>" +
        '<span class="recado">' + esc(recado) + "</span>" +
        '<span class="rodape-ingresso"><span>Dia ' + estado.dia + "</span>" +
        "<span>" + esc(U.dataCurta(d)) + "</span><span>4 cartazes</span></span>" +
        "</span>" +
        '<span class="canhoto"><span class="serie">' + (i === 0 ? "01" : "02") + "</span>" +
        '<span class="admite">admite<br>um</span></span>' +
        "</button>";
    });

    html += "</div>";
    if (situacao(estado.dia, 1) === "fim" && situacao(estado.dia, 2) === "fim") {
      html += chamadaImpulso();
    }
    $("tela-sessoes").innerHTML = html;
    Array.prototype.forEach.call($("tela-sessoes").querySelectorAll(".ingresso"), function (b) {
      b.onclick = function () { abrirSessao(estado.dia, +b.dataset.sessao); };
    });
    pintarLogos();
    ligarChamada();
    mostrar("sessoes");
  }

  /* Lockup da Impulso. Se o arquivo oficial existir em assets/logo-impulso.svg
     (ou .png), ele substitui a versao remontada em tipografia. */
  function logotipo(classe) {
    return '<a class="logo-impulso ' + (classe || "") + '" href="' + CFG.site +
      '" target="_blank" rel="noopener" aria-label="Impulso Filmes">' +
      '<img alt="Impulso Filmes">' +
      '<span class="logo-texto" aria-hidden="true"><b>IMPULSO</b><i>FILMES</i></span></a>';
  }

  var arquivoDoLogo = null;
  function acharLogo() {
    if (arquivoDoLogo !== null) return Promise.resolve(arquivoDoLogo);
    var opcoes = ["assets/logo-impulso.svg", "assets/logo-impulso.png"];
    return new Promise(function (ok) {
      var i = 0;
      (function tentar() {
        if (i >= opcoes.length) { arquivoDoLogo = ""; return ok(""); }
        var caminho = opcoes[i++];
        var img = new Image();
        img.onload = function () { arquivoDoLogo = caminho; ok(caminho); };
        img.onerror = tentar;
        img.src = caminho;
      })();
    });
  }

  function pintarLogos() {
    acharLogo().then(function (caminho) {
      if (!caminho) return;
      Array.prototype.forEach.call(document.querySelectorAll(".logo-impulso"), function (a) {
        var img = a.querySelector("img");
        if (img && !img.src) { img.src = caminho; a.classList.add("tem-arquivo"); }
      });
    });
  }

  /* o clique no botao da chamada e a metrica que interessa pro negocio:
     quanta gente sai do joguinho pro site da Impulso */
  function ligarChamada() {
    Array.prototype.forEach.call(document.querySelectorAll(".chamada a.cta, .logo-impulso"), function (a) {
      if (a.dataset.contado) return;
      a.dataset.contado = "1";
      a.addEventListener("click", function () {
        global.METRICAS.evento("saiu-pra-impulso", "Clicou para o site da Impulso");
      });
    });
  }

  function chamadaImpulso() {
    return '<div class="chamada">' +
      logotipo() + "<h3>" + esc(CFG.chamada.titulo) + "</h3><p>" +
      esc(CFG.chamada.texto) + '</p><a class="cta" href="' + CFG.site + '" target="_blank" rel="noopener">' +
      esc(CFG.chamada.botao) + "</a></div>";
  }

  /* ================= tela: desafio ================= */

  function abrirSessao(dia, sessao) {
    estado.dia = dia;
    estado.sessao = sessao;
    var p = partida(dia, sessao, true);
    if (!p.contado) {
      p.contado = true;
      salvar();
      global.METRICAS.evento("sessao-aberta/" + sessao, "Sessão " + sessao + " aberta");
      if (dia !== HOJE) global.METRICAS.evento("cinemateca", "Dia anterior jogado");
    }
    if (p.fim) return telaFim();
    while (p.atual < p.itens.length && p.itens[p.atual].fim) p.atual++;
    if (p.atual >= p.itens.length) { p.fim = true; salvar(); return telaFim(); }
    telaDesafio();
  }

  function itemAtual() {
    var p = partida(estado.dia, estado.sessao);
    return { p: p, item: p.itens[p.atual], filme: CAL.porId(p.itens[p.atual].id) };
  }

  function telaDesafio() {
    var ctx = itemAtual(), p = ctx.p, item = ctx.item, filme = ctx.filme;
    var nome = CFG.sessoes.filter(function (s) { return s.id === estado.sessao; })[0].nome;
    var passos = p.itens.map(function (i, n) {
      var c = "";
      if (i.fim) c = i.acertou ? "ok" : "errou";
      if (n === p.atual) c = "agora";
      return "<i" + (c ? ' class="' + c + '"' : "") + "></i>";
    }).join("");

    $("tela-jogo").innerHTML =
      '<div class="jogo-grade">' +
      '<div class="jogo-esq">' +
      '<div class="moldura" id="moldura"><div class="carregando">carregando…</div></div>' +
      "</div>" +
      '<div class="jogo-dir">' +
      '<div class="cabeca"><h1>' + esc(nome) + " <i>·</i> " +
      (p.atual + 1) + " de " + p.itens.length + "</h1>" +
      '<span class="trilha">' + passos + "</span></div>" +
      '<div class="dica-titulo">O que já sabemos</div>' +
      '<div class="dicas" id="dicas"></div>' +
      '<div class="palpite"><input id="entrada" type="text" autocomplete="off" autocapitalize="off" ' +
      'spellcheck="false" placeholder="Que filme é esse?" aria-label="Seu palpite">' +
      '<div class="sugestoes oculto" id="sugestoes"></div></div>' +
      '<button class="acao" id="btn-chutar">Chutar</button>' +
      '<div class="rodape-acao"><span class="tentativas" id="tentativas"></span>' +
      '<button class="desisto" id="btn-pular">desisto desta</button></div>' +
      '<div id="ultimo-erro"></div>' +
      "</div></div>";

    montarImagem($("moldura"), filme, item.erros.length);
    montarDicas(filme, item.erros.length);
    montarTentativas(item);
    ligarEntrada();
    mostrar("jogo");

    /* adianta o download do proximo cartaz enquanto a pessoa pensa */
    var proximo = p.itens[p.atual + 1];
    if (proximo) IMG.precarregar([CAL.porId(proximo.id)]);
  }

  /* Desenha o cartaz quadriculado.
     O truque: a imagem e desenhada num canvas minusculo (14 pixels de largura
     na primeira tentativa) e o navegador amplia esse canvas sem suavizar, com
     image-rendering: pixelated. Cada pixel vira um quadradinho solido.
     Feito em canvas, e nao em CSS, porque assim o numero de quadradinhos nao
     depende da densidade de tela do aparelho — no celular retina, um mosaico
     feito por CSS sairia com o dobro ou o triplo de blocos e o jogo ficaria
     mais facil justamente pra quem tem tela melhor.
     Desenhar imagem de outro dominio "suja" o canvas, o que so impediria ler
     os pixels de volta; exibir, que e o que interessa aqui, continua valendo.
     Por isso nao se pede crossOrigin: pedir CORS numa imagem que ja esta em
     cache sem CORS faria o navegador recusar a imagem inteira. */
  function recorteCobrindo(img, proporcao) {
    var lf = img.naturalWidth, af = img.naturalHeight;
    var pf = lf / af;
    if (pf > proporcao) {                 /* sobra largura: corta dos lados */
      var l = af * proporcao;
      return [(lf - l) / 2, 0, l, af];
    }
    var a = lf / proporcao;               /* sobra altura: corta em cima e embaixo */
    return [0, (af - a) / 2, lf, a];
  }

  function quadricular(moldura, img, blocos) {
    /* a proporcao vem do quadro como ele esta na tela, e nao de um valor fixo:
       no celular a moldura fica quase quadrada por causa do limite de altura,
       e um canvas 2:3 seria recortado de novo pelo object-fit, deixando o
       quadradinho retangular e a conta de blocos errada */
    var proporcao = (moldura.clientWidth && moldura.clientHeight)
      ? moldura.clientWidth / moldura.clientHeight
      : 2 / 3;
    var tela = document.createElement("canvas");
    tela.width = Math.max(4, blocos);
    tela.height = Math.max(4, Math.round(blocos / proporcao));
    var pincel = tela.getContext("2d");
    var r = recorteCobrindo(img, proporcao);
    pincel.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, tela.width, tela.height);
    moldura.innerHTML = "";
    moldura.appendChild(tela);
  }

  function montarImagem(moldura, filme, etapa, revelar) {
    IMG.resolver(filme).then(function (r) {
      if (!moldura.isConnected) return;
      var img = new Image();
      img.alt = revelar ? esc(filme.titulo) : "Cartaz quadriculado do filme do desafio";
      img.referrerPolicy = "no-referrer";
      img.onload = function () {
        moldura.classList.toggle("larga", img.naturalWidth / img.naturalHeight > 1.2);
        if (revelar) {
          moldura.innerHTML = "";
          moldura.appendChild(img);
        } else {
          var escada = CFG.blocosPorEtapa || [14, 24, 44, 90];
          quadricular(moldura, img, escada[Math.min(etapa, escada.length - 1)]);
        }
        if (r.gerada) {
          var et = document.createElement("span");
          et.className = "etiqueta-imagem";
          et.textContent = "cartaz indisponível";
          moldura.appendChild(et);
        }
      };
      /* a imagem ja foi validada pelo resolvedor, entao aqui so resta o caso
         raro de ela sumir do ar entre um passo e outro */
      img.onerror = function () {
        moldura.innerHTML = '<div class="carregando">cartaz indisponível</div>';
      };
      img.src = r.url;
    });
  }

  function montarDicas(filme, etapa, tudo) {
    var linhas = [["Gênero", NOMES_CATEGORIA[filme.categoria] || filme.categoria]];
    if (etapa >= 1 || tudo) linhas.push(["Origem", filme.pais + " · anos " + (Math.floor(filme.ano / 10) * 10)]);
    if (etapa >= 2 || tudo) linhas.push(["Sinal", filme.dica]);
    if (etapa >= 3 || tudo) linhas.push(["Ficha", "Direção de " + filme.diretor + " · com " + filme.elenco]);
    $("dicas").innerHTML = linhas.map(function (l) {
      var longa = String(l[1]).length > 34 ? " longa" : "";
      return '<div class="dica' + longa + '"><b>' + esc(l[0]) + "</b><span>" + esc(l[1]) + "</span></div>";
    }).join("");
  }

  function montarTentativas(item) {
    var total = CFG.tentativasPorDesafio, gastas = item.erros.length;
    var marcas = "";
    for (var i = 0; i < total; i++) marcas += "<i" + (i < gastas ? ' class="gasta"' : "") + "></i>";
    var t = $("tentativas");
    t.innerHTML = marcas;
    t.title = (total - gastas) + " de " + total + " tentativas restantes";
  }

  /* ---------- autocomplete ---------- */

  var INDICE = CAL.acervo.map(function (f) {
    return { f: f, chaves: U.chavesDoFilme(f).concat([U.normalizar(f.diretor)]) };
  });

  function buscar(texto) {
    var t = U.normalizar(texto);
    if (t.length < 2) return [];
    var comeco = [], meio = [];
    for (var i = 0; i < INDICE.length && comeco.length + meio.length < 40; i++) {
      var e = INDICE[i], achou = 0;
      for (var j = 0; j < e.chaves.length; j++) {
        if (e.chaves[j].indexOf(t) === 0) { achou = 2; break; }
        if (e.chaves[j].indexOf(t) > 0) achou = 1;
      }
      if (achou === 2) comeco.push(e.f);
      else if (achou === 1) meio.push(e.f);
    }
    return comeco.concat(meio).slice(0, 8);
  }

  function ligarEntrada() {
    var entrada = $("entrada"), caixa = $("sugestoes");

    function pintar() {
      if (!estado.sugestoes.length) { caixa.classList.add("oculto"); return; }
      caixa.innerHTML = estado.sugestoes.map(function (f, i) {
        return '<button type="button" data-i="' + i + '"' +
          (i === estado.marcada ? ' class="marcada"' : "") + ">" +
          esc(f.titulo) + "<small>" + f.ano + "</small></button>";
      }).join("");
      caixa.classList.remove("oculto");
      Array.prototype.forEach.call(caixa.querySelectorAll("button"), function (b) {
        b.onmousedown = function (ev) {
          ev.preventDefault();
          enviar(estado.sugestoes[+b.dataset.i].titulo);
        };
      });
    }

    entrada.oninput = function () {
      estado.sugestoes = buscar(entrada.value);
      estado.marcada = -1;
      pintar();
    };
    entrada.onkeydown = function (ev) {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        if (!estado.sugestoes.length) return;
        ev.preventDefault();
        var n = estado.sugestoes.length;
        estado.marcada = (estado.marcada + (ev.key === "ArrowDown" ? 1 : -1) + n + 1) % (n + 1) - 0;
        if (estado.marcada > n - 1) estado.marcada = -1;
        pintar();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        var escolhido = estado.marcada >= 0 ? estado.sugestoes[estado.marcada].titulo : entrada.value;
        enviar(escolhido);
      } else if (ev.key === "Escape") {
        caixa.classList.add("oculto");
      }
    };
    entrada.onblur = function () { setTimeout(function () { caixa.classList.add("oculto"); }, 120); };

    $("btn-chutar").onclick = function () {
      var escolhido = estado.marcada >= 0 ? estado.sugestoes[estado.marcada].titulo : entrada.value;
      enviar(escolhido);
    };
    $("btn-pular").onclick = function () { desistir(); };
    setTimeout(function () { if (global.innerWidth > 700) entrada.focus(); }, 80);
  }

  /* ---------- palpite ---------- */

  function enviar(texto) {
    if (!texto || !U.normalizar(texto)) return;
    var ctx = itemAtual(), p = ctx.p, item = ctx.item, filme = ctx.filme;

    if (U.acertou(texto, filme)) {
      item.acertou = true;
      item.fim = true;
      item.pontos = CFG.tentativasPorDesafio - item.erros.length;
      salvar();
      return telaRevelacao();
    }

    item.erros.push(String(texto).slice(0, 80));
    if (item.erros.length >= CFG.tentativasPorDesafio) {
      item.fim = true;
      item.pontos = 0;
      salvar();
      return telaRevelacao();
    }
    salvar();

    var entrada = $("entrada");
    entrada.value = "";
    estado.sugestoes = []; estado.marcada = -1;
    $("sugestoes").classList.add("oculto");
    montarImagem($("moldura"), filme, item.erros.length);
    montarDicas(filme, item.erros.length);
    montarTentativas(item);
    $("ultimo-erro").innerHTML = '<div class="erro-anterior">' + esc(texto) + " não é. Olha de novo.</div>";
  }

  function desistir() {
    var ctx = itemAtual(), item = ctx.item;
    item.fim = true;
    item.pulou = true;
    item.pontos = 0;
    salvar();
    telaRevelacao();
  }

  /* ================= tela: revelacao ================= */

  function comentario(filme) {
    var lista = PIADAS.porCategoria[filme.categoria];
    var h = U.hash(filme.id + ":impulso");
    if (lista && lista.length && h % 2 === 0) return lista[h % lista.length];
    return PIADAS.geral[h % PIADAS.geral.length];
  }

  function telaRevelacao() {
    var ctx = itemAtual(), p = ctx.p, item = ctx.item, filme = ctx.filme;
    var ultimo = p.atual >= p.itens.length - 1;
    var tarja = item.acertou
      ? '<div class="resultado-tarja acerto">Acertou em ' + (item.erros.length + 1) +
        (item.erros.length === 0 ? "ª — de primeira!" : "ª · +" + item.pontos + " pontos") + "</div>"
      : '<div class="resultado-tarja erro">' + (item.pulou ? "Passou a vez" : "Acabaram as tentativas") + "</div>";

    $("tela-revelacao").innerHTML =
      '<div class="jogo-grade">' +
      '<div class="jogo-esq"><div class="moldura" id="moldura-revelada"></div></div>' +
      '<div class="jogo-dir">' + tarja +
      '<div class="ficha">' +
      "<h2>" + esc(filme.titulo) + "</h2>" +
      '<p class="original">' + esc(filme.original) + " · " + filme.ano + "</p>" +
      "<dl>" +
      "<dt>Direção</dt><dd>" + esc(filme.diretor) + "</dd>" +
      "<dt>Elenco</dt><dd>" + esc(filme.elenco) + "</dd>" +
      "<dt>Origem</dt><dd>" + esc(filme.pais) + " · " + esc(NOMES_CATEGORIA[filme.categoria] || filme.categoria) + "</dd>" +
      "</dl>" +
      '<p class="curiosidade">' + esc(filme.curiosidade) + "</p>" +
      '<div class="impulso-comenta"><b>A Impulso comenta</b>' + esc(comentario(filme)) + "</div>" +
      "</div>" +
      '<button class="acao" id="btn-proximo" style="margin-top:20px">' +
      (ultimo ? "Ver o placar da sessão" : "Próximo cartaz") + "</button>" +
      "</div></div>";

    montarImagem($("moldura-revelada"), filme, 0, true);
    $("btn-proximo").onclick = function () {
      if (ultimo) { p.fim = true; salvar(); return telaFim(); }
      p.atual++;
      salvar();
      telaDesafio();
    };
    mostrar("revelacao");
  }

  /* ================= tela: fim de sessao ================= */

  function nota(pontos) {
    if (pontos >= 16) return "PALMA DE OURO";
    if (pontos >= 13) return "OBRA-PRIMA";
    if (pontos >= 10) return "CULT";
    if (pontos >= 7) return "SESSÃO DA TARDE";
    if (pontos >= 4) return "DIRETO PRO STREAMING";
    return "CORTADO NA ILHA";
  }

  function fechamento(pontos) {
    var grupo = pontos >= 13 ? "otimo" : pontos >= 9 ? "bom" : pontos >= 5 ? "medio" : "ruim";
    var lista = PIADAS.fechamento[grupo];
    return lista[(estado.dia + estado.sessao) % lista.length];
  }

  function gradeEmoji(p) {
    return p.itens.map(function (i) {
      return i.acertou ? EMOJI[i.erros.length] : EMOJI_ERRO;
    }).join("");
  }

  /* Mensagem de desafio pro WhatsApp. Os dois nomes sao opcionais: sem eles
     o texto continua fazendo sentido, so perde o endereco pessoal. */
  function textoDesafio(p, eu, amigo) {
    var linhas = [];
    linhas.push("\uD83C\uDFAC " + (amigo ? amigo + ", quantos" : "Quantos") +
      " filmes você reconhece só pelo cartaz desfocado?");
    linhas.push("");
    linhas.push("Meu placar de hoje: " + gradeEmoji(p) + " " + pontosDa(p) +
      "/" + (p.itens.length * CFG.tentativasPorDesafio));
    linhas.push("São 8 cartazes por dia, 4 tentativas cada. Bate esse?");
    linhas.push("");
    linhas.push(CFG.urlDoJogo);
    if (eu) {
      linhas.push("");
      linhas.push("Desafio de " + eu + " \uD83C\uDF7F");
    }
    return linhas.join("\n");
  }

  var CHAVE_APELIDO = "cartaz.v1.apelido";

  function montarDesafio(p) {
    var eu = $("desafio-eu"), amigo = $("desafio-amigo");
    var aviso = $("desafio-aviso"), previa = $("desafio-previa");
    var guardado = U.ler(CHAVE_APELIDO, "");
    if (guardado) eu.value = guardado;

    function nomes() {
      var lista = [["Seu nome", eu.value], ["O nome de quem recebe", amigo.value]];
      for (var i = 0; i < lista.length; i++) {
        var valor = String(lista[i][1] || "").trim();
        if (!valor) continue;
        var r = global.NOMES.conferir(valor);
        if (!r.ok) return { erro: lista[i][0] + ": " + r.motivo };
      }
      return { eu: String(eu.value || "").trim(), amigo: String(amigo.value || "").trim() };
    }

    function atualizar() {
      var n = nomes();
      aviso.textContent = n.erro || "";
      var texto = textoDesafio(p, n.erro ? "" : n.eu, n.erro ? "" : n.amigo);
      previa.textContent = texto;
      return n.erro ? null : texto;
    }

    eu.oninput = amigo.oninput = atualizar;
    atualizar();

    $("btn-desafiar").onclick = function () {
      var texto = atualizar();
      if (!texto) { aviso.textContent = aviso.textContent || "Revise os nomes."; return; }
      U.gravar(CHAVE_APELIDO, String(eu.value || "").trim());
      global.METRICAS.evento("desafiou-amigo", "Desafiou alguém no WhatsApp");
      global.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank", "noopener");
    };

    $("btn-copiar-desafio").onclick = function () {
      var texto = atualizar();
      if (!texto) return;
      U.gravar(CHAVE_APELIDO, String(eu.value || "").trim());
      global.METRICAS.evento("copiou-desafio", "Copiou a mensagem de desafio");
      copiar(texto, this, "Mensagem copiada!");
    };
  }

  function textoCompartilhavel(p) {
    var nome = CFG.sessoes.filter(function (s) { return s.id === p.sessao; })[0].nome;
    return CFG.nome + " · Dia " + p.dia + " · " + nome + "\n" +
      gradeEmoji(p) + "  " + pontosDa(p) + "/" + (p.itens.length * CFG.tentativasPorDesafio) + "\n" +
      CFG.urlDoJogo;
  }

  function telaFim() {
    var p = partida(estado.dia, estado.sessao);
    var pontos = pontosDa(p);
    if (!p.fimContado) {
      p.fimContado = true;
      salvar();
      global.METRICAS.evento("partida-concluida", "Sessão concluída");
      global.METRICAS.evento("pontos/" + pontos, "Fechou com " + pontos + " de 16");
    }
    var max = p.itens.length * CFG.tentativasPorDesafio;
    var estrelas = Math.round(pontos / max * 4);
    var acertos = p.itens.filter(function (i) { return i.acertou; }).length;
    var proxima = CFG.sessoes.filter(function (s) {
      return s.id !== p.sessao && situacao(estado.dia, s.id) !== "fim";
    })[0];

    var lista = p.itens.map(function (i) {
      var f = CAL.porId(i.id);
      return "<li><span>" + (i.acertou ? EMOJI[i.erros.length] : EMOJI_ERRO) + "</span>" +
        "<span>" + esc(f.titulo) + ' <span class="ano">(' + f.ano + ")</span></span></li>";
    }).join("");

    $("tela-fim").innerHTML =
      '<div class="coluna-estreita"><div class="placar">' +
      '<div class="estrelas">' + "★".repeat(estrelas) + "☆".repeat(4 - estrelas) + "</div>" +
      '<p class="nota">' + nota(pontos) + "</p>" +
      '<p class="de">' + pontos + " de " + max + " pontos · " + acertos + " de " + p.itens.length + " cartazes</p>" +
      "</div>" +
      '<div class="grade-resultado"><span>' + gradeEmoji(p) + "</span></div>" +
      '<div class="impulso-comenta"><b>A Impulso comenta</b>' + esc(fechamento(pontos)) + "</div>" +
      '<ul class="resumo-lista">' + lista + "</ul>" +
      '<button class="acao" id="btn-compartilhar" style="margin-top:22px">Compartilhar resultado</button>' +
      '<div class="desafio"><h3>Desafie alguém</h3>' +
      "<p>A gente escreve a mensagem, você só escolhe para quem.</p>" +
      '<div class="campos">' +
      '<input id="desafio-eu" type="text" maxlength="16" autocomplete="off" placeholder="Seu nome (opcional)" aria-label="Seu nome">' +
      '<input id="desafio-amigo" type="text" maxlength="16" autocomplete="off" placeholder="Nome de quem vai receber (opcional)" aria-label="Nome de quem vai receber">' +
      "</div>" +
      '<div class="aviso" id="desafio-aviso"></div>' +
      '<div class="previa" id="desafio-previa"></div>' +
      '<button class="acao" id="btn-desafiar">Abrir no WhatsApp</button>' +
      '<button class="acao calma" id="btn-copiar-desafio" style="margin-top:8px">Copiar mensagem</button></div>' +
      (proxima
        ? '<button class="acao calma" id="btn-proxima-sessao" style="margin-top:22px">Ir para a ' +
          esc(proxima.nome) + "</button>"
        : "") +
      '<button class="acao calma" id="btn-voltar-sessoes" style="margin-top:8px">Voltar</button>' +
      "</div>" + chamadaImpulso();

    $("btn-compartilhar").onclick = function () {
      global.METRICAS.evento("compartilhou", "Compartilhou o resultado");
      compartilhar(p, this);
    };
    if (proxima) $("btn-proxima-sessao").onclick = function () { abrirSessao(estado.dia, proxima.id); };
    $("btn-voltar-sessoes").onclick = telaSessoes;
    montarDesafio(p);
    pintarLogos();
    ligarChamada();
    mostrar("fim");
  }

  function copiar(texto, botao, recado) {
    function avisar(msg) {
      var antes = botao.textContent;
      botao.textContent = msg;
      setTimeout(function () { botao.textContent = antes; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto)
        .then(function () { avisar(recado || "Copiado!"); })
        .catch(function () { avisar("Não deu pra copiar"); });
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); avisar(recado || "Copiado!"); }
    catch (e) { avisar("Não deu pra copiar"); }
    document.body.removeChild(ta);
  }

  function compartilhar(p, botao) {
    var texto = textoCompartilhavel(p);
    if (navigator.share) {
      navigator.share({ text: texto }).catch(function () {});
      return;
    }
    copiar(texto, botao);
  }

  /* ================= cinemateca ================= */

  function telaCinemateca() {
    var quadros = "";
    for (var d = 1; d <= HOJE; d++) {
      var s1 = situacao(d, 1), s2 = situacao(d, 2);
      var classe = "dia-quadro jogavel";
      if (s1 === "fim" && s2 === "fim") classe += " completo";
      else if (s1 !== "nova" || s2 !== "nova") classe += " parcial";
      if (d === HOJE) classe += " hoje";
      quadros += '<button class="' + classe + '" data-dia="' + d + '">' + d + "</button>";
    }
    $("tela-cinemateca").innerHTML =
      '<div class="coluna-estreita"><h2 style="font-size:2rem;margin-bottom:10px">Cinemateca</h2>' +
      '<p style="color:var(--fraco);font-size:.92rem;margin:0">' +
      "Chegou agora? Nenhum dia se perde: dá pra jogar desde o dia 1. " +
      "O acervo tem " + CAL.acervo.length + " filmes e passa " + CAL.diasPorCiclo +
      " dias sem repetir um cartaz.</p>" +
      '<div class="grade-dias" id="grade-dias">' + quadros + "</div>" +
      '<div class="legenda">' +
      '<span><i style="background:rgba(78,164,106,.6)"></i>dia completo</span>' +
      '<span><i style="background:rgba(253,185,8,.5)"></i>começado</span>' +
      '<span><i style="background:#17171a"></i>não jogado</span>' +
      "</div>" +
      '<button class="acao calma" id="fechar-cinemateca" style="margin-top:22px">Voltar</button></div>';

    Array.prototype.forEach.call($("grade-dias").querySelectorAll("button"), function (b) {
      b.onclick = function () { estado.dia = +b.dataset.dia; telaSessoes(); };
    });
    $("fechar-cinemateca").onclick = telaSessoes;
    mostrar("cinemateca");
  }

  /* ================= numeros ================= */

  function estatisticas() {
    var sessoesFeitas = 0, desafios = 0, acertados = 0, pontos = 0;
    var porTentativa = [0, 0, 0, 0], falhas = 0;
    var diasCompletos = {};
    Object.keys(partidas).forEach(function (k) {
      var p = partidas[k];
      if (!p.fim) return;
      sessoesFeitas++;
      diasCompletos[p.dia] = true;
      p.itens.forEach(function (i) {
        desafios++;
        pontos += i.pontos;
        if (i.acertou) { acertados++; porTentativa[i.erros.length]++; }
        else falhas++;
      });
    });
    var seq = 0;
    for (var d = HOJE; d >= 1; d--) {
      if (diasCompletos[d]) seq++;
      else if (d !== HOJE) break;
    }
    return {
      sessoes: sessoesFeitas, desafios: desafios, acertados: acertados, pontos: pontos,
      porTentativa: porTentativa, falhas: falhas, sequencia: seq
    };
  }

  function telaNumeros() {
    var e = estatisticas();
    var pct = e.desafios ? Math.round(e.acertados / e.desafios * 100) : 0;
    var maior = Math.max(1, Math.max.apply(null, e.porTentativa.concat([e.falhas])));
    var barras = e.porTentativa.map(function (n, i) {
      return linhaBarra((i + 1) + "ª", n, maior);
    }).join("") + linhaBarra("✗", e.falhas, maior);

    modal(
      "<h2>Seus números</h2>" +
      '<div class="numeros">' +
      "<div><b>" + e.sessoes + "</b><span>sessões</span></div>" +
      "<div><b>" + e.acertados + "</b><span>acertos</span></div>" +
      "<div><b>" + pct + "%</b><span>aproveitamento</span></div>" +
      "<div><b>" + e.sequencia + "</b><span>dias seguidos</span></div>" +
      "</div><p>Em que tentativa você costuma acertar:</p>" + barras +
      "<p style='margin-top:14px'>Tudo isso fica salvo só no seu aparelho — sem cadastro, sem servidor, sem e-mail.</p>"
    );
  }

  function linhaBarra(rotulo, valor, maior) {
    var largura = Math.max(6, Math.round(valor / maior * 100));
    return '<div style="display:flex;align-items:center;gap:8px;margin:5px 0;font-size:.82rem">' +
      '<span style="width:20px;color:var(--texto-fraco)">' + rotulo + "</span>" +
      '<span style="flex:0 0 ' + largura + '%;background:var(--impulso);color:#171717;border-radius:4px;' +
      'padding:2px 6px;text-align:right;font-weight:600">' + valor + "</span></div>";
  }

  /* ================= ajuda ================= */

  function telaAjuda() {
    modal(
      "<h2>Como se joga</h2>" +
      "<p>Todo dia o " + CFG.nome + " abre <b>duas sessões</b> de <b>quatro cartazes</b> cada. " +
      "A imagem começa desfocada e ampliada; a cada erro ela clareia e aparece uma dica nova.</p>" +
      "<ul>" +
      "<li>Você tem <b>4 tentativas</b> por cartaz. Acertar de primeira vale 4 pontos, depois 3, 2 e 1.</li>" +
      "<li>Pode digitar o título em português ou o original — o campo sugere enquanto você escreve.</li>" +
      "<li>A <b>" + esc(CFG.sessoes[1].nome) + "</b> abre quando você termina a <b>" + esc(CFG.sessoes[0].nome) + "</b>.</li>" +
      "<li>Perdeu dias? A <b>Cinemateca</b> (no ▦ lá em cima) libera tudo desde o dia 1.</li>" +
      "<li>Não tem login nem cadastro: seu histórico fica salvo no próprio navegador.</li>" +
      "</ul>" +
      "<p>O acervo tem <b>" + CAL.acervo.length + " filmes</b>, de 1902 a 2024 — Hollywood clássico e moderno, " +
      "cinema brasileiro, europeu, mundial, vanguarda, animação e documentário.</p>" +
      '<p style="margin-top:16px">Feito pela <a href="' + CFG.site + '" target="_blank" rel="noopener">Impulso Filmes</a>, ' +
      "que faz vídeo institucional, publicitário e de conteúdo para indústrias e grandes marcas. " +
      "Se você reconhece um bom plano, a gente se entende.</p>"
    );
  }

  /* ================= partida do dia / inicio ================= */

  function lerParametros() {
    var q = new URLSearchParams(global.location.search);
    if (q.has("reset")) {
      if (q.get("reset") === "tudo") { partidas = {}; U.apagar(CHAVE_PARTIDAS); IMG.limparCache(); }
      else {
        var dia = +(q.get("dia") || HOJE);
        delete partidas[chave(dia, 1)];
        delete partidas[chave(dia, 2)];
        salvar();
      }
    }
    var d = parseInt(q.get("dia"), 10);
    if (d >= 1 && d <= HOJE) estado.dia = d;
    var s = parseInt(q.get("sessao"), 10);
    if (q.has("reset") || q.has("dia") || q.has("sessao")) {
      var limpa = global.location.pathname;
      if (d >= 1 && d <= HOJE) limpa += "?dia=" + d;
      global.history.replaceState({}, "", limpa);
    }
    return (s === 1 || s === 2) ? s : null;
  }

  function rodape() {
    $("rodape").innerHTML =
      '<span id="contador-publico"></span>' +
      "Um joguinho da " + logotipo() + "<br>" +
      '<a href="' + CFG.site + '" target="_blank" rel="noopener">' + esc(CFG.siteRotulo) + "</a><br>" +
      esc(CFG.creditoImagens);

    global.METRICAS.frase().then(function (texto) {
      var alvo = $("contador-publico");
      if (!texto || !alvo) return;
      alvo.innerHTML = esc(texto) + "<br>";
      alvo.style.color = "var(--impulso)";
    });
  }

  function iniciar() {
    global.METRICAS.instalar();
    var sessaoPedida = lerParametros();
    rodape();
    pintarLogos();
    $("btn-ajuda").onclick = telaAjuda;
    $("btn-cinemateca").onclick = telaCinemateca;
    $("btn-numeros").onclick = telaNumeros;

    var primeiraVez = !U.ler(CHAVE_VISITA, false);
    U.gravar(CHAVE_VISITA, true);

    if (sessaoPedida) abrirSessao(estado.dia, sessaoPedida);
    else telaSessoes();

    if (primeiraVez) telaAjuda();

    /* adianta os cartazes da sessao do dia */
    var doDia = CAL.filmesDoDia(estado.dia);
    IMG.precarregar(doDia[1].slice(0, 2));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})(window);
