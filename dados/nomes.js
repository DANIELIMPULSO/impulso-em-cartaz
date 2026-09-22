/* IMPULSO EM CARTAZ — regras de nome pro placar.
   O jogo e material de marca: o placar nao pode virar mural de xingamento.
   A checagem roda no navegador antes de enviar e de novo no servidor, porque
   filtro so no navegador qualquer um contorna.

   Como a conferencia funciona:
     1. normaliza (minuscula, sem acento, sem leet, sem repeticao de letra)
     2. barra token identico a uma palavra da lista PALAVRAS
     3. barra trecho da lista TRECHOS dentro do nome inteiro sem espacos
        (pega "ca ra lho", "c4r4lh0" e afins)
   TRECHOS so aceita termo que nao aparece dentro de nome de gente — "anal"
   e "cu", por exemplo, ficam em PALAVRAS, senao Ana Luiza e Curitiba
   virariam palavrao. */
(function (global) {
  "use strict";

  /* barradas quando sao a palavra inteira (curtas ou que cabem dentro de
     nomes comuns) */
  var PALAVRAS = [
    "cu", "cus", "cuzao", "cuzudo", "anal", "anus", "rabo", "bunda",
    "puta", "putas", "puto", "putao", "vadia", "vagabunda", "piranha",
    "viado", "viadao", "bicha", "bichona", "traveco", "sapatao",
    "merda", "bosta", "peido", "peidao", "pika",
    "xota", "xoxota", "ppk", "perereca", "greluda",
    "gozo", "gozada", "punheta", "punheteiro", "siririca",
    "trepar", "transar", "foda", "fodas", "fode", "fodeu", "fdp", "pqp",
    "crlh", "krl", "vtnc", "tnc", "vsf", "pnc",
    "burro", "burra", "otario", "otaria", "idiota", "imbecil", "retardado",
    "mongol", "mongoloide", "debil", "escroto", "escrota", "babaca",
    "corno", "cornao", "chifrudo", "bastardo", "desgracado",
    "macaco", "macaca", "crioulo", "nazi", "hitler", "genocida",
    "estuprador", "pedofilo",
    "admin", "adm", "moderador", "oficial", "impulso", "impulsofilmes",
    "bot", "robo", "sistema", "anonimo", "null", "undefined", "teste"
  ];

  /* barradas em qualquer posicao do nome (longas e inequivocas) */
  var TRECHOS = [
    "caralho", "carai", "porra", "buceta", "boceta", "piroca", "pinto grande",
    "chupa", "chupar", "mamada", "boquete", "penis", "vagina", "xereca",
    "filhadaputa", "filhodaputa", "vaitomarno", "vaisefoder", "vseform",
    "arrombado", "arrombada", "cachorra", "safada", "safado", "putaria",
    "pornô", "porno", "pornografia", "xvideos", "nudes",
    "viadinho", "bichinha", "baitola", "boiola", "traveco",
    "macumbeiro", "favelado", "vagabundo", "marginal", "ladrao",
    "suvaco", "cheiroso nao",
    "matar", "morte", "suicid", "estupro", "estuprar", "pedofil",
    "nazista", "nazismo", "hitlerista", "supremacista", "kkk klan",
    "http", "www.", ".com", ".net", "whatsapp", "telegram", "compre",
    "aposta", "bet365", "cassino", "pixbet"
  ];

  var MAPA_LEET = {
    "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
    "@": "a", "$": "s", "!": "i", "|": "i", "+": "t"
  };

  function semAcento(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* "C4­R­A­A­A­LH0!!" -> "caralho" */
  function normalizar(nome) {
    var s = semAcento(nome).toLowerCase();
    s = s.replace(/[0134578@$!|+]/g, function (c) { return MAPA_LEET[c] || c; });
    s = s.replace(/[^a-z0-9\s]/g, " ");
    s = s.replace(/(.)\1{2,}/g, "$1$1");   /* aaaa -> aa (Anna continua Anna) */
    return s.replace(/\s+/g, " ").trim();
  }

  function so(s) { return s.replace(/[^a-z0-9]/g, ""); }

  /* Tres leituras do mesmo nome, porque quem quer burlar escreve de todo
     jeito: com numero no lugar de letra, com letra repetida e com espaco no
     meio da palavra. O que passa nas tres passa. */
  function formas(nome) {
    var comLeet = normalizar(nome);
    var semLeet = normalizar(String(nome).replace(/[0134578@$!|+]/g, ""));
    return {
      tokens: comLeet.split(" ").filter(Boolean),
      variantes: [
        so(comLeet),
        so(semLeet),
        so(comLeet).replace(/(.)\1+/g, "$1")   /* "caaralho" -> "caralho" */
      ]
    };
  }

  var TRECHOS_PRONTOS = null;
  function trechosProntos() {
    if (!TRECHOS_PRONTOS) {
      TRECHOS_PRONTOS = TRECHOS.map(function (t) { return so(normalizar(t)); })
        .filter(function (t) { return t.length >= 3; });
    }
    return TRECHOS_PRONTOS;
  }

  function limpo(nome) {
    var f = formas(nome);

    /* palavra inteira: token a token, e tambem o nome sem espaco
       (pega o disfarce "p u t a") */
    var alvos = f.tokens.concat(f.variantes);
    for (var i = 0; i < alvos.length; i++) {
      var a = alvos[i];
      if (PALAVRAS.indexOf(a) >= 0) return false;
      if (PALAVRAS.indexOf(a.replace(/(.)\1+/g, "$1")) >= 0) return false;
    }

    /* trecho em qualquer posicao, em qualquer uma das leituras */
    var lista = trechosProntos();
    for (var j = 0; j < lista.length; j++) {
      for (var k = 0; k < f.variantes.length; k++) {
        if (f.variantes[k].indexOf(lista[j]) >= 0) return false;
      }
    }
    return true;
  }

  /* devolve {ok:true, nome:"..."} ou {ok:false, motivo:"..."} */
  function conferir(bruto) {
    var nome = String(bruto == null ? "" : bruto).replace(/\s+/g, " ").trim();

    if (nome.length < 2) return { ok: false, motivo: "Escreva pelo menos duas letras." };
    if (nome.length > 16) return { ok: false, motivo: "No máximo 16 caracteres." };
    if (!/^[\p{L}\p{N} .'-]+$/u.test(nome)) {
      return { ok: false, motivo: "Use só letras, números, espaço e hífen." };
    }
    if (!/\p{L}/u.test(nome)) return { ok: false, motivo: "O nome precisa ter letras." };
    if (/\d{5,}/.test(nome)) return { ok: false, motivo: "Isso parece um telefone." };
    if (!limpo(nome)) {
      return { ok: false, motivo: "Esse nome não passa no crivo da bilheteria. Escolha outro." };
    }
    return { ok: true, nome: nome };
  }

  global.NOMES = { conferir: conferir, normalizar: normalizar, limpo: limpo };
})(window);
