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
     atrasado pode jogar os dias anteriores na Cinemateca.
     Zerado para o teste: hoje e o dia 1. Na hora de divulgar de verdade,
     recuar esta data alguns dias faz a Cinemateca ja nascer com acervo.
     Nao mude depois de publicar: a numeracao dos dias mudaria junto. */
  dataInicio: "2026-09-22",

  /* --- partida --- */
  desafiosPorSessao: 6,
  tentativasPorDesafio: 4,
  /* Quantos quadradinhos de largura o cartaz tem em cada etapa, da primeira
     tentativa ate a ultima. Numero menor = mais dificil. Desfoque escondia
     ate a composicao e nao dava chance; o mosaico deixa massa de cor, recorte
     de figura e diagramacao aparecerem, que e do que o cinefilo precisa. */
  blocosPorEtapa: [14, 22, 28, 90],

  sessoes: [
    { id: 1, nome: "Matinê",             abertura: "Pra começar o dia." },
    { id: 2, nome: "Sessão da Meia-Noite", abertura: "Agora sem dó." }
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
  tmdbApiKey: "5795a8a4f9f420641c3fa6a894afcf10",
  tmdbIdioma: "pt-BR",
  /* "cartaz" usa poster; "misto" alterna entre poster e still/backdrop.
     Esta em "cartaz" porque o jogo mostra a imagem dentro de uma vitrine de
     cinema, e foto de cena deitada dentro de um quadro de poster fica errada.
     Para experimentar still, trocar aqui e afrouxar a proporcao da moldura. */
  tipoDeImagem: "cartaz",
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
    titulo: "Quem faz esse joguinho também faz filme",
    texto: "A Impulso Filmes é uma produtora de Juiz de Fora que atende o Brasil inteiro. Filme publicitário, vídeo institucional e branded content para empresas e indústrias — e, como núcleo criativo, projetos autorais em cinema e TV. No mercado desde 2013.",
    botao: "Conhecer a Impulso"
  }
};
