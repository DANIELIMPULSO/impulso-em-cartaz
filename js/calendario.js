/* IMPULSO EM CARTAZ — quais filmes caem em cada dia.
   Regras: a ordem e sorteada, mas sempre a mesma pra todo mundo (semente fixa);
   as categorias sao distribuidas de forma proporcional pra nenhum dia cair
   todo em cima do mesmo tipo de cinema; e so depois de passar pelo acervo
   inteiro e que um filme pode repetir. */
(function (global) {
  "use strict";

  /* semente do sorteio: mudar esse numero reembaralha o calendario inteiro */
  var SEMENTE = 0x14D50;

  var CFG = global.CARTAZ_CONFIG;
  var ACERVO = global.CARTAZ_ACERVO;
  var PORID = {};
  ACERVO.forEach(function (f) { PORID[f.id] = f; });

  var porCiclo = {};

  function sequencia(ciclo) {
    if (porCiclo[ciclo]) return porCiclo[ciclo];

    var grupos = {};
    ACERVO.forEach(function (f) {
      (grupos[f.categoria] = grupos[f.categoria] || []).push(f);
    });

    var marcados = [];
    Object.keys(grupos).sort().forEach(function (cat) {
      var lista = global.U.embaralhar(grupos[cat], SEMENTE + ciclo * 7919 + global.U.hash(cat));
      var n = lista.length;
      /* cada categoria e espalhada por igual ao longo da fila: o item j fica
         na posicao relativa (j + meio) / n, com um deslocamento proprio da
         categoria pra elas nao empatarem sempre na mesma ordem */
      var desvio = (global.U.hash(cat + ":" + ciclo) / 4294967296) / n;
      lista.forEach(function (filme, j) {
        marcados.push({ filme: filme, chave: (j + 0.5) / n + desvio });
      });
    });

    marcados.sort(function (a, b) { return a.chave - b.chave; });
    var fila = marcados.map(function (m) { return m.filme; });
    porCiclo[ciclo] = fila;
    return fila;
  }

  /* os 8 filmes de um dia, sem repetir dentro do mesmo ciclo do acervo */
  function filmesDoDia(dia) {
    var porDia = CFG.desafiosPorSessao * CFG.sessoes.length;
    var total = ACERVO.length;
    var inicio = (dia - 1) * porDia;
    var lista = [];
    for (var i = 0; i < porDia; i++) {
      var pos = inicio + i;
      var ciclo = Math.floor(pos / total);
      lista.push(sequencia(ciclo)[pos - ciclo * total]);
    }
    lista.sort(function (a, b) { return a.nivel - b.nivel; });

    var sessoes = {};
    CFG.sessoes.forEach(function (s, i) {
      sessoes[s.id] = lista
        .slice(i * CFG.desafiosPorSessao, (i + 1) * CFG.desafiosPorSessao)
        .sort(function (a, b) { return a.nivel - b.nivel; });
    });
    return sessoes;
  }

  function hoje() {
    return Math.max(1, global.U.diaDeHoje(CFG.dataInicio));
  }

  global.CAL = {
    acervo: ACERVO,
    porId: function (id) { return PORID[id]; },
    filmesDoDia: filmesDoDia,
    hoje: hoje,
    diasPorCiclo: Math.floor(ACERVO.length / (CFG.desafiosPorSessao * CFG.sessoes.length))
  };
})(window);
