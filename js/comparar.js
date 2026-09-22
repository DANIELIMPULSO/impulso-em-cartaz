/* IMPULSO EM CARTAZ — o quadro de palpites, no espírito do Capadodia.
   Errar deixa de ser só "não é esse": cada chute devolve quatro colunas
   comparando o filme chutado com o do dia.
     verde     igual
     amarelo   perto (vertente vizinha, mesma região, até duas décadas)
     vermelho  longe
   No ano, a seta diz a direção: ↑ o filme do dia é mais recente, ↓ mais antigo. */
(function (global) {
  "use strict";

  /* vertentes que se tocam: errar entre elas e chegar perto */
  var FAMILIA = {
    "hollywood-classico": "hollywood",
    "hollywood-moderno": "hollywood",
    "europeu": "autoral",
    "vanguarda": "autoral",
    "nacional": "fora-do-eixo",
    "mundo": "fora-do-eixo",
    "documentario": "documentario",
    "animacao": "animacao"
  };

  /* nomes que cabem numa celula estreita de celular */
  var NOME_CURTO = {
    "hollywood-classico": "Clássico",
    "hollywood-moderno": "Hollywood",
    "nacional": "Nacional",
    "europeu": "Europeu",
    "mundo": "Mundial",
    "vanguarda": "Vanguarda",
    "animacao": "Animação",
    "documentario": "Doc."
  };

  var REGIAO = {
    "estados unidos": "america-norte", "canada": "america-norte",
    "brasil": "america-latina", "mexico": "america-latina", "chile": "america-latina",
    "argentina": "america-latina", "cuba": "america-latina",
    "franca": "europa", "italia": "europa", "reino unido": "europa", "alemanha": "europa",
    "espanha": "europa", "suecia": "europa", "dinamarca": "europa", "austria": "europa",
    "noruega": "europa", "portugal": "europa", "polonia": "europa", "grecia": "europa",
    "uniao sovietica": "europa", "russia": "europa", "ucrania": "europa",
    "japao": "asia", "coreia do sul": "asia", "china": "asia", "hong kong": "asia",
    "taiwan": "asia", "india": "asia", "tailandia": "asia",
    "ira": "oriente-medio", "israel": "oriente-medio", "palestina": "oriente-medio",
    "turquia": "oriente-medio",
    "mauritania": "africa", "senegal": "africa", "africa do sul": "africa",
    "australia": "oceania", "nova zelandia": "oceania"
  };

  var SIGLA = {
    "estados unidos": "EUA",
    "uniao sovietica": "URSS",
    "reino unido": "Reino Unido",
    "coreia do sul": "Coreia do Sul",
    "nova zelandia": "Nova Zelândia"
  };

  function sem(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  /* "Brasil / França" -> "Brasil": vale o país que produz primeiro */
  function principal(pais) {
    return String(pais || "").split("/")[0].trim();
  }

  function paisCurto(pais) {
    var p = principal(pais);
    return SIGLA[sem(p)] || p;
  }

  /* Nome curto da direcao, que cabe numa celula:
       "Joel e Ethan Coen"              -> Coen      (irmaos dividem sobrenome)
       "Fernando Meirelles e Kátia Lund"-> Meirelles (nome comprido: so o final)
       "Bong Joon-ho"                   -> Bong Joon-ho (curto: vai inteiro,
                                          porque em nome coreano o sobrenome
                                          vem na frente e cortar erraria) */
  function sobrenome(diretor) {
    var segs = String(diretor || "").split(/\s+e\s+|,\s*/)
      .map(function (x) { return x.trim(); })
      .filter(Boolean);
    var primeiro = segs[0] || "";
    if (segs.length > 1 && primeiro.split(/\s+/).length === 1) {
      var fim = segs[segs.length - 1].split(/\s+/);
      return fim[fim.length - 1];
    }
    if (primeiro.length <= 12) return primeiro;
    var partes = primeiro.split(/\s+/);
    return partes[partes.length - 1] || primeiro;
  }

  function mesmoDiretor(a, b) {
    return sem(String(a.diretor).split(/\s+e\s+|,/)[0]) === sem(String(b.diretor).split(/\s+e\s+|,/)[0]);
  }

  function corDoGenero(a, b) {
    if (a.categoria === b.categoria) return "verde";
    if (FAMILIA[a.categoria] && FAMILIA[a.categoria] === FAMILIA[b.categoria]) return "amarelo";
    return "vermelho";
  }

  function corDoPais(a, b) {
    var pa = sem(principal(a.pais)), pb = sem(principal(b.pais));
    if (pa === pb) return "verde";
    /* coproducao conta como perto: "Brasil / França" e "França" se tocam */
    var listaA = String(a.pais).split("/").map(function (x) { return sem(x); });
    var listaB = String(b.pais).split("/").map(function (x) { return sem(x); });
    for (var i = 0; i < listaA.length; i++) {
      if (listaB.indexOf(listaA[i]) >= 0) return "amarelo";
    }
    if (REGIAO[pa] && REGIAO[pa] === REGIAO[pb]) return "amarelo";
    return "vermelho";
  }

  function corDoAno(a, b) {
    var d = Math.abs(a.ano - b.ano);
    if (Math.floor(a.ano / 10) === Math.floor(b.ano / 10)) return "verde";
    if (d <= 20) return "amarelo";
    return "vermelho";
  }

  /* devolve as quatro colunas do palpite, na ordem em que aparecem */
  function linhas(chute, alvo) {
    var seta = alvo.ano === chute.ano ? "" : (alvo.ano > chute.ano ? "↑" : "↓");
    return [
      { rotulo: "Gênero", valor: NOME_CURTO[chute.categoria] || chute.categoria, cor: corDoGenero(chute, alvo) },
      { rotulo: "País", valor: paisCurto(chute.pais), cor: corDoPais(chute, alvo) },
      { rotulo: "Ano", valor: chute.ano + (seta ? " " + seta : ""), cor: corDoAno(chute, alvo) },
      { rotulo: "Direção", valor: sobrenome(chute.diretor), cor: mesmoDiretor(chute, alvo) ? "verde" : "vermelho" }
    ];
  }

  global.COMPARAR = { linhas: linhas, sobrenome: sobrenome, paisCurto: paisCurto };
})(window);
