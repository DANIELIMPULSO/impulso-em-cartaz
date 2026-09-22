/* IMPULSO EM CARTAZ — de onde vem o cartaz de cada filme.
   Nada e baixado pro repositorio: a imagem e resolvida no navegador de quem
   joga e fica em cache no proprio aparelho. Se tudo falhar, o jogo desenha um
   cartaz tipografico e a partida continua. */
(function (global) {
  "use strict";

  var CFG = global.CARTAZ_CONFIG;
  var CHAVE = "cartaz.v1.imagens";
  var cache = global.U.ler(CHAVE, {});
  var pendentes = {};

  function agora() { return Date.now(); }

  function valido(reg) {
    if (!reg) return false;
    if (reg.url) return (agora() - reg.ts) < (CFG.diasDeCacheDeImagem || 30) * 86400000;
    /* Guardar "nao achei" por muito tempo e perigoso: se a falha veio de rede
       instavel ou de limite de pedidos, o filme ficaria dias mostrando o
       cartaz tipografico. So confio no "nao achei" que foi gravado sabendo
       que a rede estava boa (instavel === false); o que veio de tropeco vale
       uma hora, e registro velho, sem esse dado, nao vale nada. */
    if (reg.instavel === false) return (agora() - reg.ts) < 2 * 86400000;
    if (reg.instavel === true) return (agora() - reg.ts) < 3600000;
    return false;
  }

  function guardar(id, reg) {
    cache[id] = reg;
    global.U.gravar(CHAVE, cache);
  }

  /* confirma que a URL realmente vira imagem antes de aceita-la */
  function carregar(url) {
    return new Promise(function (ok, falha) {
      if (!url) return falha();
      var img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = function () {
        if (img.naturalWidth < 60) return falha();
        ok(url);
      };
      img.onerror = falha;
      img.src = url;
    });
  }

  function json(url) {
    return fetch(url, { mode: "cors", credentials: "omit" }).then(function (r) {
      if (!r.ok) {
        var e = new Error("http " + r.status);
        e.http = r.status;
        throw e;
      }
      return r.json();
    });
  }

  function esperar(ms) {
    return new Promise(function (ok) { setTimeout(ok, ms); });
  }

  /* A Wikipedia responde 429 quando leva uma rajada de pedidos — foi o que
     derrubou a primeira conferencia do acervo. Duas retentativas com espera
     crescente resolvem sem judiar do servidor. O ctx anota que a rede vacilou,
     pra nao gravar um "nao achei" que na verdade foi bloqueio. */
  function jsonTeimoso(url, ctx, tentativa) {
    tentativa = tentativa || 0;
    return json(url).catch(function (e) {
      /* 429 e 5xx sao o servidor pedindo calma: vale insistir devagar.
         Erro sem status e rede fora ou dominio bloqueado — ai insistir so
         faria a pessoa esperar mais pra ver o mesmo cartaz tipografico. */
      var pedindoCalma = e.http === 429 || e.http >= 500;
      if (!e.http || pedindoCalma) { if (ctx) ctx.instavel = true; }
      if (pedindoCalma && tentativa < 2) {
        return esperar(600 * Math.pow(3, tentativa)).then(function () {
          return jsonTeimoso(url, ctx, tentativa + 1);
        });
      }
      throw e;
    });
  }

  /* ---------- Wikipedia (padrao, sem chave) ---------- */

  /* Cartaz de cinema e sempre em pe. Foto de cena, logotipo de estudio e
     retrato de diretor — que e o que a Wikipedia as vezes poe como imagem
     principal do verbete — costumam ser quadrados ou deitados. */
  function emPe(p) {
    var t = p.thumbnail;
    if (!t || !t.width || !t.height) return true;
    return t.height / t.width >= 1.15;
  }

  /* Cartaz oficial e material protegido: a Wikipedia hospeda esse tipo de
     imagem no proprio idioma (/wikipedia/en/, /wikipedia/pt/), sob uso justo.
     O Commons (/wikipedia/commons/) so aceita imagem livre — que e onde moram
     arte de fa, poster alternativo e foto de divulgacao. Preferir o arquivo
     local evita justamente o cartaz feito por fa.
     Ressalva: filme antigo em dominio publico tem o cartaz OFICIAL no Commons,
     e por isso esta regra vale so na primeira passada; a segunda aceita. */
  function hospedagemLocal(url) {
    return url.indexOf("/wikipedia/commons/") < 0;
  }

  /* Numa busca, o primeiro resultado pode ser outro verbete ("lista de filmes
     de...", a obra que inspirou, o remake). Exige que o titulo da pagina tenha
     ao menos uma palavra forte do filme procurado. */
  function tituloBate(p, palavras) {
    if (!palavras || !palavras.length) return true;
    var t = global.U.normalizar(p.title || "");
    for (var i = 0; i < palavras.length; i++) {
      if (t.indexOf(palavras[i]) >= 0) return true;
    }
    return false;
  }

  function palavrasFortes(texto) {
    return global.U.normalizar(texto).split(" ").filter(function (w) {
      return w.length >= 4;
    });
  }

  function paginaComImagem(dados, exig) {
    var paginas = dados && dados.query && dados.query.pages;
    if (!paginas) return null;
    /* numa busca, a ordem vem no campo "index" — sem isso o navegador
       devolveria as paginas na ordem do id, que nao e a do ranking */
    var lista = Object.keys(paginas).map(function (k) { return paginas[k]; });
    lista.sort(function (a, b) {
      return (a.index == null ? 99 : a.index) - (b.index == null ? 99 : b.index);
    });
    exig = exig || {};
    for (var i = 0; i < lista.length; i++) {
      var p = lista[i];
      if (!p || !p.thumbnail || !p.thumbnail.source) continue;
      if (!tituloBate(p, exig.palavras)) continue;
      if (exig.emPe && !emPe(p)) continue;
      if (exig.local && !hospedagemLocal(p.thumbnail.source)) continue;
      var origem = p.original && p.original.source;
      /* imagens muito grandes pesam no celular: so uso a original se for
         de tamanho razoavel */
      if (origem && p.original.width && p.original.width <= 1600) return origem;
      return p.thumbnail.source;
    }
    return null;
  }

  function wikiPorTitulo(lang, titulo, ctx, exig) {
    var url = "https://" + lang + ".wikipedia.org/w/api.php?action=query&format=json" +
      "&origin=*&redirects=1&prop=pageimages&piprop=original%7Cthumbnail&pithumbsize=720" +
      "&titles=" + encodeURIComponent(titulo);
    return jsonTeimoso(url, ctx).then(function (d) {
      /* verbete pedido pelo titulo exato: nao precisa conferir o nome da
         pagina, so o formato da imagem */
      return paginaComImagem(d, { emPe: exig && exig.emPe, local: exig && exig.local });
    });
  }

  function wikiPorBusca(lang, termo, ctx, exig) {
    var url = "https://" + lang + ".wikipedia.org/w/api.php?action=query&format=json" +
      "&origin=*&prop=pageimages&piprop=original%7Cthumbnail&pithumbsize=720" +
      "&generator=search&gsrlimit=3&gsrsearch=" + encodeURIComponent(termo);
    return jsonTeimoso(url, ctx).then(function (d) {
      return paginaComImagem(d, exig);
    });
  }

  function tentativasWiki(filme, ctx) {
    var idiomas = CFG.wikiIdiomas || ["pt", "en"];
    var lista = [];
    idiomas.forEach(function (lang) {
      var titulo = filme.wiki && filme.wiki[lang];
      if (titulo) {
        lista.push({
          fonte: "wikipedia:" + lang,
          buscar: function (exig) { return wikiPorTitulo(lang, titulo, ctx, exig); }
        });
      }
    });
    idiomas.forEach(function (lang) {
      var termo = (lang === "pt")
        ? filme.titulo + " filme " + filme.ano
        : (filme.original || filme.titulo) + " " + filme.ano + " film";
      lista.push({
        fonte: "wikipedia:" + lang + ":busca",
        buscar: function (exig) {
          return wikiPorBusca(lang, termo, ctx, {
            emPe: exig && exig.emPe,
            local: exig && exig.local,
            palavras: palavrasFortes(lang === "pt" ? filme.titulo : (filme.original || filme.titulo))
          });
        }
      });
    });
    return lista;
  }

  /* ---------- TMDB (opcional, se houver chave) ---------- */

  function querStill(filme) {
    if (CFG.tipoDeImagem === "cartaz") return false;
    if (CFG.tipoDeImagem === "still") return true;
    return (global.U.hash(filme.id) % 3) === 0; /* no modo misto, 1 em cada 3 */
  }

  function tmdb(filme, ctx) {
    var chave = CFG.tmdbApiKey;
    if (!chave) return Promise.resolve(null);
    var url = "https://api.themoviedb.org/3/search/movie?api_key=" + encodeURIComponent(chave) +
      "&language=" + encodeURIComponent(CFG.tmdbIdioma || "pt-BR") +
      "&year=" + filme.ano +
      "&query=" + encodeURIComponent(filme.original || filme.titulo);
    return jsonTeimoso(url, ctx).then(function (d) {
      var r = d && d.results && d.results[0];
      if (!r) return null;
      var still = querStill(filme) && r.backdrop_path;
      if (still) return "https://image.tmdb.org/t/p/w780" + r.backdrop_path;
      if (r.poster_path) return "https://image.tmdb.org/t/p/w500" + r.poster_path;
      return r.backdrop_path ? "https://image.tmdb.org/t/p/w780" + r.backdrop_path : null;
    });
  }

  /* ---------- cartaz desenhado na hora (ultimo recurso) ---------- */

  var PALETA = [
    ["#1b1b2f", "#e94f37"], ["#11212d", "#f6ae2d"], ["#20122b", "#ef476f"],
    ["#0d1b2a", "#00b4d8"], ["#231b1b", "#f4a259"], ["#12211a", "#8ac926"]
  ];

  function cartazGerado(filme) {
    var p = PALETA[global.U.hash(filme.id) % PALETA.length];
    var decada = Math.floor(filme.ano / 10) * 10;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="#000"/>' +
      "</linearGradient></defs>" +
      '<rect width="400" height="600" fill="url(#g)"/>' +
      '<circle cx="200" cy="250" r="120" fill="none" stroke="' + p[1] + '" stroke-width="2" opacity=".5"/>' +
      '<text x="200" y="285" font-family="Georgia,serif" font-size="150" fill="' + p[1] + '" text-anchor="middle" opacity=".85">?</text>' +
      '<text x="200" y="430" font-family="Helvetica,Arial,sans-serif" font-size="34" letter-spacing="6" fill="#fff" text-anchor="middle" opacity=".9">' + decada + "s</text>" +
      '<text x="200" y="470" font-family="Helvetica,Arial,sans-serif" font-size="16" letter-spacing="3" fill="#fff" text-anchor="middle" opacity=".55">' +
      String(filme.pais || "").split("/")[0].trim().toUpperCase() + "</text>" +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- resolucao ---------- */

  function candidatos(filme, ctx) {
    var lista = [];
    if (filme.imagem) {
      lista.push({ fonte: "manual", buscar: function () { return Promise.resolve(filme.imagem); } });
    }
    if (CFG.usarImagensLocais) {
      lista.push({
        fonte: "local",
        buscar: function () { return Promise.resolve("dados/imagens/" + filme.id + ".jpg"); }
      });
    }
    if (CFG.tmdbApiKey) {
      lista.push({ fonte: "tmdb", buscar: function () { return tmdb(filme, ctx); } });
    }
    return lista.concat(tentativasWiki(filme, ctx));
  }

  function tentarEmSequencia(filme, lista, i, exig) {
    if (i >= lista.length) return Promise.resolve(null);
    var passo = lista[i];
    return Promise.resolve()
      .then(function () { return passo.buscar(exig); })
      .then(function (url) {
        if (!url) throw new Error("vazio");
        return carregar(url).then(function () {
          return { url: url, fonte: passo.fonte };
        });
      })
      .catch(function () { return tentarEmSequencia(filme, lista, i + 1, exig); });
  }

  /* devolve sempre um objeto { url, fonte, gerada } — nunca rejeita */
  function resolver(filme) {
    var reg = cache[filme.id];
    if (valido(reg)) {
      if (reg.url) return Promise.resolve({ url: reg.url, fonte: reg.fonte, gerada: false, doCache: true });
      return Promise.resolve({ url: cartazGerado(filme), fonte: "gerada", gerada: true, doCache: true });
    }
    if (pendentes[filme.id]) return pendentes[filme.id];

    var ctx = { instavel: false };
    /* Duas passadas: a primeira so aceita imagem em pe, que e o formato de
       cartaz; se nenhuma fonte tiver cartaz, a segunda aceita o que houver,
       porque uma foto de cena ainda e melhor que cartaz nenhum. */
    var lista = candidatos(filme, ctx);
    var p = tentarEmSequencia(filme, lista, 0, { emPe: true, local: true })
      .then(function (achado) {
        return achado || tentarEmSequencia(filme, lista, 0, { emPe: false });
      })
      .then(function (achado) {
      delete pendentes[filme.id];
      if (achado) {
        guardar(filme.id, { url: achado.url, fonte: achado.fonte, ts: agora() });
        return { url: achado.url, fonte: achado.fonte, gerada: false };
      }
      guardar(filme.id, { url: null, fonte: null, ts: agora(), instavel: ctx.instavel });
      return { url: cartazGerado(filme), fonte: "gerada", gerada: true, instavel: ctx.instavel };
      });
    pendentes[filme.id] = p;
    return p;
  }

  /* Todas as imagens que as fontes oferecem pra um filme, e nao so a primeira
     que serve. E o que a ferramenta de conferencia usa pra deixar a pessoa
     escolher o cartaz certo quando a escolha automatica erra o filme — coisa
     que nenhum codigo sabe julgar sozinho. */
  function alternativas(filme) {
    var ctx = { instavel: false };
    var lista = candidatos(filme, ctx);
    return Promise.all(lista.map(function (passo) {
      return Promise.resolve()
        .then(function () { return passo.buscar({ emPe: false }); })
        .then(function (url) {
          if (!url) return null;
          return carregar(url).then(function () {
            return { url: url, fonte: passo.fonte };
          });
        })
        .catch(function () { return null; });
    })).then(function (achados) {
      var vistos = {}, saida = [];
      achados.forEach(function (a) {
        if (a && !vistos[a.url]) { vistos[a.url] = 1; saida.push(a); }
      });
      return saida;
    });
  }

  /* fixa uma imagem escolhida a mao, valendo por 30 dias como qualquer outra */
  function fixar(filme, url) {
    guardar(filme.id || filme, { url: url, fonte: "escolhida", ts: agora() });
  }

  function precarregar(filmes) {
    (filmes || []).forEach(function (f) { if (f) resolver(f); });
  }

  /* Esquece so os filmes indicados, pra tentar de novo sem jogar fora o
     cache inteiro (o que obrigaria a refazer o acervo todo). */
  function esquecer(filmes) {
    (filmes || []).forEach(function (f) { delete cache[f.id || f]; });
    global.U.gravar(CHAVE, cache);
  }

  function limparCache() {
    cache = {};
    global.U.apagar(CHAVE);
  }

  global.IMG = {
    resolver: resolver,
    precarregar: precarregar,
    esquecer: esquecer,
    alternativas: alternativas,
    fixar: fixar,
    cartazGerado: cartazGerado,
    limparCache: limparCache
  };
})(window);
