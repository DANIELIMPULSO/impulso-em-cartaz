/* IMPULSO EM CARTAZ — medicao de audiencia.
   Usa o GoatCounter: sem cookie, sem identificar ninguem e sem banner de
   consentimento. Se o codigo do site nao estiver preenchido no config.js,
   este arquivo nao carrega script nenhum e o jogo segue igual. */
(function (global) {
  "use strict";

  var CFG = (global.CARTAZ_CONFIG && global.CARTAZ_CONFIG.metricas) || {};
  var codigo = CFG.goatcounter || "";
  var ligado = !!codigo;
  var base = ligado ? "https://" + codigo + ".goatcounter.com" : "";
  var fila = [];

  function instalar() {
    if (!ligado) return;
    /* o script e carregado sem "auto count" pra primeira visita ser contada
       junto com o resto, sem duplicar */
    global.goatcounter = { no_onload: true };
    var s = document.createElement("script");
    s.async = true;
    s.src = "//gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", base + "/count");
    s.onload = function () {
      visita();
      fila.forEach(function (e) { registrar(e.caminho, e.titulo); });
      fila = [];
    };
    document.head.appendChild(s);
  }

  function visita() {
    if (!ligado || !global.goatcounter || !global.goatcounter.count) return;
    global.goatcounter.count({ path: location.pathname || "/" });
  }

  /* um evento e so um "caminho" marcado como evento: aparece no painel como
     uma linha propria, sem misturar com as paginas */
  function registrar(caminho, titulo) {
    if (!ligado) return;
    if (!global.goatcounter || !global.goatcounter.count) {
      fila.push({ caminho: caminho, titulo: titulo });
      return;
    }
    global.goatcounter.count({ path: caminho, title: titulo || caminho, event: true });
  }

  /* Numero publico, pra mostrar no rodape. So responde se a opcao
     "Allow adding visitor counts to your website" estiver ligada no painel. */
  function contar(caminho) {
    if (!ligado) return Promise.resolve(null);
    return fetch(base + "/counter/" + encodeURIComponent(caminho) + ".json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || d.count == null) return null;
        return parseInt(String(d.count).replace(/\D/g, ""), 10) || 0;
      })
      .catch(function () { return null; });
  }

  function formatar(n) {
    return n.toLocaleString("pt-BR");
  }

  /* Devolve a frase pronta do rodape, ou null se nao houver numero.
     Nunca deixa o jogo esperando: se o painel nao responder, some. */
  function frase() {
    if (!ligado || CFG.mostrarContador === false) return Promise.resolve(null);
    var pisoVisitas = CFG.minimoDeVisitas == null ? 30 : CFG.minimoDeVisitas;
    var pisoSessoes = CFG.minimoDeSessoes == null ? 10 : CFG.minimoDeSessoes;
    return Promise.all([contar("TOTAL"), contar("partida-concluida")])
      .then(function (r) {
        var visitas = r[0], partidas = r[1];
        var partes = [];
        if (partidas >= pisoSessoes) {
          partes.push(formatar(partidas) + (partidas === 1 ? " sessão jogada" : " sessões jogadas"));
        }
        if (visitas >= pisoVisitas) {
          partes.push(formatar(visitas) + (visitas === 1 ? " visita" : " visitas"));
        }
        return partes.length ? partes.join(" · ") : null;
      });
  }

  global.METRICAS = {
    ligado: ligado,
    instalar: instalar,
    evento: registrar,
    frase: frase
  };
})(window);
