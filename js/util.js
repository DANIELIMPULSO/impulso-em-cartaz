/* IMPULSO EM CARTAZ — funcoes de apoio: texto, sorteio estavel, datas e armazenamento. */
(function (global) {
  "use strict";

  /* ---------- texto ---------- */

  var ARTIGOS = /^(o|a|os|as|um|uma|the|le|la|les|il|el|los|las|der|die|das)\s+/;

  function semAcento(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* forma canonica usada pra comparar palpite com resposta */
  function normalizar(s) {
    return semAcento(s)
      .toLowerCase()
      .replace(/[&]/g, " e ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  /* versao sem artigo inicial e sem subtitulo depois de ":" ou "-" */
  function nucleo(s) {
    var base = normalizar(String(s).split(/[:—]|\s-\s/)[0]);
    return base.replace(ARTIGOS, "").trim();
  }

  /* todas as formas aceitas como acerto de um filme */
  function chavesDoFilme(filme) {
    var formas = [filme.titulo, filme.original].concat(filme.aceita || []);
    var saida = [];
    formas.forEach(function (f) {
      if (!f) return;
      var n = normalizar(f);
      var c = nucleo(f);
      if (n && saida.indexOf(n) < 0) saida.push(n);
      if (c && c.length > 3 && saida.indexOf(c) < 0) saida.push(c);
    });
    return saida;
  }

  function acertou(palpite, filme) {
    var p = normalizar(palpite);
    if (!p) return false;
    var chaves = chavesDoFilme(filme);
    if (chaves.indexOf(p) >= 0) return true;
    var pn = p.replace(ARTIGOS, "").trim();
    return chaves.indexOf(pn) >= 0;
  }

  /* ---------- sorteio estavel ----------
     mesma semente, mesma ordem, em qualquer navegador e qualquer dia */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function embaralhar(lista, semente) {
    var r = mulberry32(semente);
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* ---------- datas (sempre no fuso local de quem joga) ---------- */

  function aoMeioDia(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  }

  function deISO(iso) {
    var p = String(iso).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
  }

  function paraISO(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + dia;
  }

  /* numero do dia do jogo: 1 na data de inicio */
  function diaDeHoje(dataInicio) {
    var ms = aoMeioDia(new Date()) - deISO(dataInicio);
    return Math.floor(ms / 86400000) + 1;
  }

  function dataDoDia(dataInicio, numero) {
    var d = deISO(dataInicio);
    d.setDate(d.getDate() + (numero - 1));
    return d;
  }

  /* "22 set 2026" — cabe numa linha de ingresso, ao contrario do por extenso */
  function dataCurta(d) {
    var meses = ["jan", "fev", "mar", "abr", "mai", "jun",
                 "jul", "ago", "set", "out", "nov", "dez"];
    return d.getDate() + " " + meses[d.getMonth()] + " " + d.getFullYear();
  }

  function dataPorExtenso(d) {
    var meses = ["jan", "fev", "mar", "abr", "mai", "jun",
                 "jul", "ago", "set", "out", "nov", "dez"];
    return d.getDate() + " de " + meses[d.getMonth()] + ". de " + d.getFullYear();
  }

  /* ---------- armazenamento (nunca derruba o jogo se estiver bloqueado) ---------- */

  var memoria = {};

  function ler(chave, padrao) {
    try {
      var bruto = global.localStorage.getItem(chave);
      if (bruto == null) return chave in memoria ? memoria[chave] : padrao;
      return JSON.parse(bruto);
    } catch (e) {
      return chave in memoria ? memoria[chave] : padrao;
    }
  }

  function gravar(chave, valor) {
    memoria[chave] = valor;
    try {
      global.localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  function apagar(chave) {
    delete memoria[chave];
    try { global.localStorage.removeItem(chave); } catch (e) {}
  }

  global.U = {
    semAcento: semAcento,
    normalizar: normalizar,
    nucleo: nucleo,
    chavesDoFilme: chavesDoFilme,
    acertou: acertou,
    embaralhar: embaralhar,
    hash: hash,
    deISO: deISO,
    paraISO: paraISO,
    diaDeHoje: diaDeHoje,
    dataDoDia: dataDoDia,
    dataPorExtenso: dataPorExtenso,
    dataCurta: dataCurta,
    ler: ler,
    gravar: gravar,
    apagar: apagar
  };
})(window);
