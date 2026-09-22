/* IMPULSO EM CARTAZ — configuracao geral.
   Este e o unico arquivo que precisa ser mexido no dia a dia. */
window.CARTAZ_CONFIG = {

  /* --- marca --- */
  nome: "IMPULSO EM CARTAZ",
  assinatura: "um joguinho pra cinéfilo, da Impulso Filmes",
  site: "https://impulsofilmes.com.br",
  siteRotulo: "impulsofilmes.com.br",
  /* endereco publico do jogo, usado no texto de compartilhamento */
  urlDoJogo: "https://danielimpulso.github.io/impulso-em-cartaz/",

  /* --- calendario ---
     DIA 1 do jogo. Todo dia depois disso ganha um numero, e quem chega
     atrasado pode jogar os dias anteriores na Cinemateca. Esta marcado cinco
     dias antes da estreia de proposito: assim a Cinemateca ja abre com
     acervo, e quem chega no primeiro dia tem o que jogar alem da rodada
     do dia.
     Nao mude depois de publicar: a numeracao dos dias mudaria junto. */
  dataInicio: "2026-09-17",

  /* --- partida --- */
  desafiosPorSessao: 4,
  tentativasPorDesafio: 4,
  sessoes: [
    { id: 1, nome: "Matinê",             abertura: "Quatro cartazes pra começar o dia." },
    { id: 2, nome: "Sessão da Meia-Noite", abertura: "Mais quatro, e agora sem dó." }
  ],
  /* como a segunda sessao do dia libera:
     "aposessao1" — assim que a pessoa termina a Matine (recomendado)
     "hora"       — a partir do horario em liberaSessao2Hora (relogio local) */
  liberacaoSessao2: "aposessao1",
  liberaSessao2Hora: 18,

  /* --- imagens ---
     O jogo nao guarda cartaz nenhum no repositorio: ele resolve a imagem de
     cada filme no navegador de quem joga, nesta ordem.
       1. filme.imagem          (URL fixa escrita a mao no acervo)
       2. dados/imagens/<id>.jpg (se usarImagensLocais estiver ligado)
       3. TMDB                  (se tmdbApiKey estiver preenchida)
       4. Wikipedia             (padrao, nao precisa de chave nenhuma)
       5. cartaz tipografico gerado na hora (nunca fica buraco na tela)
     A chave do TMDB, se usada, fica visivel no codigo do site — use uma
     chave de leitura (API Key v3), que e publica por natureza. */
  usarImagensLocais: false,
  tmdbApiKey: "",
  tmdbIdioma: "pt-BR",
  /* "cartaz" usa poster; "misto" alterna entre poster e still/backdrop */
  tipoDeImagem: "misto",
  wikiIdiomas: ["pt", "en"],
  diasDeCacheDeImagem: 30,

  /* --- medicao ---
     Codigo do site no GoatCounter: se o painel dele fica em
     impulso-em-cartaz.goatcounter.com, aqui vai "impulso-em-cartaz".
     Vazio = nenhum script de terceiro e carregado.
     O GoatCounter nao usa cookie, entao o jogo nao precisa de aviso de
     consentimento. Para o contador aparecer no rodape, ligue tambem
     "Allow adding visitor counts to your website" nas Settings do painel. */
  metricas: {
    goatcounter: "impulso-em-cartaz",
    mostrarContador: true,
    /* Numero pequeno no rodape denuncia jogo vazio e desanima quem chega.
       O contador so aparece depois destes patamares. */
    minimoDeVisitas: 30,
    minimoDeSessoes: 10
  },

  /* --- textos --- */
  creditoImagens: "Imagens: Wikipedia / TMDB · uso ilustrativo, sem fins comerciais diretos.",
  chamada: {
    titulo: "Gostou de reconhecer um bom enquadramento?",
    texto: "A Impulso Filmes faz vídeo institucional, publicitário e de conteúdo para indústrias e grandes marcas. Mesmo cuidado de cinema, só que com briefing, prazo e objetivo de negócio.",
    botao: "Conhecer a Impulso"
  }
};
