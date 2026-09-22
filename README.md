# Impulso em Cartaz

Um joguinho diário de adivinhar filme pelo cartaz, feito para a **Impulso Filmes**.
No espírito do Wordle: todo dia o jogo abre **duas sessões de quatro cartazes** cada,
a imagem começa desfocada e ampliada, e vai clareando a cada erro.

Site estático puro — HTML, CSS e JavaScript, sem build, sem framework, sem backend,
sem login e sem cookie. O histórico de quem joga fica no próprio navegador.

---

## Como se joga

- **4 tentativas** por cartaz. Acertar de primeira vale 4 pontos; depois 3, 2 e 1.
  Cada sessão vale até **16 pontos**.
- A cada erro a imagem clareia e entra uma dica nova:

  | Momento | O que aparece |
  |---|---|
  | início | gênero/vertente (ex.: "Cinema brasileiro") |
  | 1º erro | país e década |
  | 2º erro | uma dica enigmática escrita à mão para aquele filme |
  | 3º erro | direção e elenco |

- Vale digitar o título em português ou o original; o campo sugere enquanto se escreve.
- A **Sessão da Meia-Noite** abre quando a pessoa termina a **Matinê**
  (dá pra trocar para "abre às 18h" no `config.js`).
- A **Cinemateca** (ícone de calendário) libera todos os dias desde o dia 1 —
  quem chegar atrasado não perde nada.
- No fim da sessão sai o placar em estrelas, a grade de emojis para compartilhar
  e a chamada da Impulso.
- **Desafie alguém**: a pessoa escreve o próprio nome e o de quem vai receber,
  vê a prévia montando em tempo real e abre o WhatsApp com a mensagem pronta
  (`https://wa.me/?text=...`, que funciona no celular e no WhatsApp Web). Os
  dois nomes são opcionais e passam pelo filtro de `dados/nomes.js` — sem isso,
  daria para mandar desaforo assinado com o link da Impulso. O próprio nome
  fica guardado para a próxima vez.

## O acervo

234 filmes, de 1902 a 2024, distribuídos assim:

| Categoria | Filmes |
|---|---|
| Hollywood moderno | 53 |
| Europeu | 39 |
| Documentário (quase todos de 2000 pra cá) | 35 |
| Nacional | 33 |
| Hollywood clássico | 28 |
| Cinema mundial (Ásia, América Latina, África) | 18 |
| Vanguarda e experimental | 15 |
| Animação | 13 |

Cada dia consome 8 filmes, então o jogo passa **29 dias sem repetir um cartaz**.
As categorias são distribuídas de forma proporcional: cada dia cai com 5 a 8
categorias diferentes, e a Matinê é sempre mais leve que a Sessão da Meia-Noite
(nível médio 1,6 contra 2,8).

---

## Publicar no GitHub Pages

1. Crie um repositório **público** (ex.: `impulso-em-cartaz`).
2. Suba o conteúdo desta pasta na raiz do repositório:

   ```bash
   git init && git add . && git commit -m "Impulso em Cartaz"
   git branch -M main
   git remote add origin https://github.com/USUARIO/impulso-em-cartaz.git
   git push -u origin main
   ```

3. No repositório: **Settings → Pages → Source: Deploy from a branch →
   Branch: `main` / `(root)` → Save**.
4. Em um ou dois minutos o jogo está no ar em
   `https://USUARIO.github.io/impulso-em-cartaz/`.
5. Ponha esse endereço em `urlDoJogo`, no `config.js` — é ele que vai junto no
   texto de quem compartilha o resultado.

O arquivo `.nojekyll` já está aqui e é necessário: sem ele o Pages ignoraria
pastas iniciadas por `_` e poderia processar os arquivos como blog.

---

## De onde vêm as imagens

**Nenhum cartaz está guardado neste repositório.** A imagem de cada filme é
resolvida no navegador de quem joga, nesta ordem:

1. `filme.imagem` — URL fixa escrita à mão no acervo (tem prioridade sobre tudo);
2. `dados/imagens/<id>.jpg` — se `usarImagensLocais` estiver ligado no `config.js`;
3. **TMDB** — se houver uma `tmdbApiKey` no `config.js`;
4. **Wikipedia** — padrão, sem chave nenhuma: tenta o verbete em português, depois
   em inglês, e por fim uma busca;
5. um **cartaz tipográfico** gerado na hora — assim nunca fica buraco na tela.

O resultado fica em cache no aparelho de quem joga por 30 dias.

### Conferindo antes de divulgar

Abra **`ferramentas/diagnostico.html`** no seu navegador. Ela roda a mesma
resolução de imagem do jogo e mostra, em vermelho, os filmes que não acharam
cartaz. Dá pra testar só os 8 de hoje ou o acervo inteiro, e copiar a lista de
falhas.

Ela roda uma passada pelo acervo, espera 15 segundos e **repesca sozinha** o que
falhou, até duas voltas — porque falha em sequência quase sempre é limite de
pedidos da Wikipedia (HTTP 429), e não falta de cartaz. Só uma conferência roda
por vez, de propósito: duas ao mesmo tempo dobram os pedidos e provocam
justamente o bloqueio que a ferramenta deveria medir.

> **Conferido em 22/09/2026: cobertura de 100%** — os 234 filmes acharam cartaz
> pela Wikipedia, sem precisar de chave do TMDB.

### Consertando um cartaz

Ache o filme pelo `id` em `dados/filmes.js` e acrescente o campo `imagem`:

```js
{id:"limite-1931", titulo:"Limite", /* ... */ imagem:"https://exemplo.org/cartaz.jpg"}
```

Ou ligue `usarImagensLocais: true` no `config.js` e ponha o arquivo em
`dados/imagens/limite-1931.jpg`.

### Usando o TMDB (opcional)

O TMDB tem cobertura melhor e traz também *stills* (fotos de cena). Pegue uma
API Key v3 gratuita em themoviedb.org e preencha `tmdbApiKey` no `config.js`.
A chave fica visível no código do site — use só a chave de leitura, que é
pública por natureza. Com ela, `tipoDeImagem: "misto"` faz um em cada três
desafios cair como still em vez de cartaz.

---

## Estrutura

```
index.html                 a página do jogo
config.js                  nome, links, data de início, sessões, imagens  ← mexa aqui
css/estilo.css             visual inteiro; as cores da marca estão no topo
assets/fontes/             Anton, Work Sans e IBM Plex Mono servidas pelo próprio site
assets/logo-impulso.png    logotipo oficial da Impulso
assets/og.jpg              arte que aparece quando o link é compartilhado
assets/icone-180.png       ícone de tela de início no celular
dados/filmes.js            o acervo: 234 filmes                            ← mexa aqui
dados/piadas.js            os textos de marca ("A Impulso comenta")        ← mexa aqui
js/util.js                 texto, sorteio estável, datas, armazenamento
js/calendario.js           qual filme cai em que dia
js/imagens.js              resolução e cache de cartazes
js/jogo.js                 motor, telas e arquivo de partidas
ferramentas/diagnostico.html   conferência de cartazes
```

### O logotipo

O arquivo oficial está em `assets/logo-impulso.png` e é usado no topo, no card
de chamada e no rodapé. Para trocá-lo, basta substituir o arquivo (ou pôr um
`assets/logo-impulso.svg`, que tem prioridade). Se os dois sumirem, o jogo
remonta o lockup com a própria tipografia da marca e nada quebra.

### A arte de compartilhamento

`assets/og.jpg` é o que aparece quando alguém cola o link no WhatsApp, no
LinkedIn ou no Slack. Se mudar o nome ou a chamada do jogo, vale refazer essa
arte — as metatags que apontam para ela estão no topo do `index.html`.

### As fontes

Anton, Work Sans e IBM Plex Mono estão embutidas em `assets/fontes/` (248 KB,
licença SIL OFL). É de propósito: muita rede corporativa — exatamente o público
da Impulso — bloqueia o Google Fonts, e aí a tipografia da marca cairia para
Arial.

---

## Medição de audiência

O jogo usa o **GoatCounter**: sem cookie, sem identificar ninguém e, por isso,
sem necessidade de banner de consentimento. Enquanto `metricas.goatcounter`
estiver vazio no `config.js`, **nenhum script de terceiro é carregado**.

Para ligar: crie o site em goatcounter.com e ponha o código no `config.js`
(se o painel fica em `impulso-em-cartaz.goatcounter.com`, o código é
`impulso-em-cartaz`). Além das visitas, o jogo marca estes eventos:

| Evento | Quando dispara |
|---|---|
| `sessao-aberta/1` e `/2` | alguém começa uma sessão |
| `partida-concluida` | terminou os quatro cartazes |
| `pontos/0` … `pontos/16` | com quanto fechou — mostra se está fácil ou difícil demais |
| `compartilhou` | clicou em compartilhar o resultado |
| `cinemateca` | jogou um dia anterior |
| `desafiou-amigo` | abriu o WhatsApp com o desafio pronto |
| `copiou-desafio` | copiou a mensagem de desafio |
| `saiu-pra-impulso` | **clicou para o site da Impulso** — a métrica de negócio |

### O contador no rodapé

Para o jogo exibir "N sessões jogadas · M visitas", ligue em
**Settings → Allow adding visitor counts to your website** no painel do
GoatCounter. Sem isso o número simplesmente não aparece, e nada quebra.

O número só entra depois de `minimoDeVisitas` (30) e `minimoDeSessoes` (10),
no `config.js`: contador baixo em jogo recém-lançado passa a impressão de
lugar vazio e desanima quem acabou de chegar. Para ver o número desde o
primeiro acesso, é só zerar esses dois valores.

### Sobre `dados/nomes.js`

Valida apelidos e barra palavrão, ofensa, spam e tentativa de se passar pela
marca. É usado no **Desafie alguém** e está pronto para um eventual placar com
nome. Entende disfarce: `C4R4LH0`, `p u t a` e `caaaralho` caem; "Pinto",
"Betânia", "Ana Luiza" e "Curitiba" passam. São 43 casos de teste — se for
mexer nas listas, rode-os antes, porque termo curto demais em `TRECHOS` começa
a reprovar nome de gente.

---

## Mexendo no acervo

Cada filme precisa destes campos:

```js
{
  id:"cidade-de-deus-2002",          // único e estável: é a chave do histórico salvo
  titulo:"Cidade de Deus",
  original:"Cidade de Deus",
  aceita:["city of god"],            // opcional: outros títulos aceitos como acerto
  ano:2002,
  diretor:"Fernando Meirelles e Kátia Lund",
  pais:"Brasil",
  categoria:"nacional",              // veja a lista no topo de dados/filmes.js
  nivel:1,                           // 1 fácil · 2 médio · 3 pra cinéfilo
  elenco:"Alexandre Rodrigues, Leandro Firmino",
  dica:"Uma galinha foge e a câmera gira 360 graus no meio do beco.",
  curiosidade:"...",                 // aparece depois da resposta
  wiki:{pt:"Cidade de Deus (filme)", en:"City of God (2002 film)"}
}
```

Dois cuidados:

- **Nunca mude um `id` já publicado.** Ele é a chave do histórico no navegador de
  quem já jogou.
- **Acrescentar filmes reembaralha o calendário** dos dias que ainda não foram
  jogados (os dias já jogados ficam preservados, porque a partida guarda os ids).
  Se quiser manter o passado intacto, o melhor momento para crescer o acervo é
  logo depois de uma virada de ciclo.

Para trocar as piadas da marca, mexa em `dados/piadas.js`: tem um monte geral,
textos por categoria de cinema e os fechamentos de sessão por desempenho.

---

## Parâmetros de URL (para testar)

| Link | O que faz |
|---|---|
| `?dia=7` | abre o dia 7 em vez do de hoje (só anda para trás) |
| `?dia=7&sessao=2` | vai direto para a segunda sessão daquele dia |
| `?reset` | apaga a partida do dia aberto e recomeça |
| `?reset=tudo` | apaga todo o histórico e o cache de imagens |

---

## Direitos de imagem

O jogo não hospeda nem redistribui cartazes: ele aponta para imagens já públicas
na Wikipedia e no TMDB, em miniatura, com finalidade de identificação e
comentário — o mesmo uso de um site de crítica. O crédito fica no rodapé.
Se a Impulso preferir um caminho mais conservador, é só ligar
`usarImagensLocais` e usar material próprio ou licenciado em `dados/imagens/`.
