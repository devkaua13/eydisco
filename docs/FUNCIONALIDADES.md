# Funcionalidades do Eydisco

Este documento descreve tudo o que a aplicação faz hoje: cada tela, quem pode usar, as regras por trás de cada ação, o que a equipe controla pelo admin e o que ainda não existe. Para rodar o projeto, veja o [README](../README.md).

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Quem usa](#2-quem-usa)
3. [Navegação](#3-navegação)
4. [Conta: cadastro, login e saída](#4-conta-cadastro-login-e-saída)
5. [Player](#5-player)
6. [Início](#6-início)
7. [Descobrir (Route) e busca](#7-descobrir-route-e-busca)
8. [Discovery Drop](#8-discovery-drop)
9. [Discs](#9-discs)
10. [Colecionar: pré-venda demonstrativa](#10-colecionar-pré-venda-demonstrativa)
11. [Pedidos](#11-pedidos)
12. [Behind the Track](#12-behind-the-track)
13. [Perfil do artista](#13-perfil-do-artista)
14. [Eydisco Radio](#14-eydisco-radio)
15. [Houses](#15-houses)
16. [Coleção](#16-coleção)
17. [Perfil de usuário](#17-perfil-de-usuário)
18. [Painel administrativo](#18-painel-administrativo)
19. [Dados de demonstração](#19-dados-de-demonstração)
20. [Como a sincronia funciona](#20-como-a-sincronia-funciona)
21. [O que ainda não existe](#21-o-que-ainda-não-existe)
22. [Referência rápida de rotas](#22-referência-rápida-de-rotas)

---

## 1. Visão geral

O Eydisco junta quatro coisas que costumam ficar separadas:

- **Descobrir música:** seleção editorial de artistas e faixas, busca e uma rádio com programação curada.
- **Ouvir junto:** as Houses são sessões marcadas em que todo mundo escuta a mesma faixa no mesmo instante, reage e conversa.
- **Conhecer o que está por trás da música:** perfil do artista, história de cada disco e créditos, inspirações e extras de cada faixa.
- **Colecionar:** cada disco físico sai em tiragem numerada. Quem garante um exemplar na pré-venda recebe um número (#127/500) que fica na sua coleção e libera conteúdos exclusivos.

Os oito módulos pedidos pelo cliente e onde cada um está:

| Módulo | Onde fica |
|---|---|
| Route | Início e Descobrir, mais a busca |
| Eydisco Radio | `/radio` e o player |
| House | `/houses` e a sala de cada House |
| Perfil do artista | `/artistas/[slug]` |
| Disc | `/discos/[slug]` |
| Estante | Coleção, em `/colecao` |
| Discovery Drop | Início, Descobrir e `/drops/[slug]` |
| Behind the Track | `/faixas/[slug]` |

A loja é **demonstrativa**: os preços são de teste, nada é cobrado e nenhum disco é enviado. Isso vem marcado em cada edição e aparece para quem usa (veja a seção 10).

## 2. Quem usa

| Perfil | O que pode fazer |
|---|---|
| **Visitante** (sem conta) | Ver tudo o que é público: Discs, faixas, artistas, Drops, rádio, Houses públicas, coleções e perfis. Ouvir faixas, a rádio e as Houses públicas. Entrar em House privada se tiver o link de convite. |
| **Usuário logado** | Tudo o que o visitante faz, mais colecionar Discs, seguir artistas, reagir e conversar nas Houses e criar Houses públicas, privadas e collector. Tem coleção, pedidos e perfil. |
| **Colecionador de um Disc** | Quem tem pelo menos um exemplar de um Disc vê os conteúdos exclusivos dele e entra nas Houses Collector daquele Disc. |
| **Anfitrião** | Quem criou a House sempre entra nela, pode começar antes do horário marcado e, se a House for privada, copia o link de convite. |
| **Gestor de artista** | Usuário ligado a um artista no admin. É o único que cria House do tipo Artista para aquele artista. |
| **Equipe** (admin) | Cadastra artistas, Discs, edições, faixas, créditos, extras, Drops, programas da rádio e Houses, e acompanha os pedidos. |

## 3. Navegação

O site tem tema escuro com roxo da marca, seguindo as referências do cliente.

- **Desktop:** barra no topo com Início, Descobrir, Rádio, Houses e Coleção, mais a busca e o avatar (ou Entrar e Criar conta).
- **Celular:** barra de abas embaixo com Início, Descobrir, Houses, Coleção e Perfil, como num app. O player fica logo acima dela.
- **Coleção e Perfil sem login:** levam para o login e, depois de entrar, a pessoa volta para onde queria ir.
- **Endereços antigos:** os de `/lancamentos/...` redirecionam para `/discos/...`.

## 4. Conta: cadastro, login e saída

**Cadastro** (`/cadastro`): nome de usuário, e-mail e senha.
- **Nome de usuário:** é único e aparece no endereço do perfil e da coleção.
- **Senha:** segue as regras do Django. Precisa ter pelo menos 8 caracteres, não pode ser comum demais, não pode ser só número e não pode parecer o nome de usuário.
- **Erros:** aparecem embaixo de cada campo. O que foi digitado continua no formulário, menos a senha.
- **Depois do cadastro:** a pessoa já entra logada e volta para a página que pediu login, se houver uma.

**Login** (`/entrar`): nome de usuário e senha.
- Com senha errada aparece "Usuário ou senha incorretos. Confira e tente de novo."
- Quem já está logado e abre `/entrar` vai para o Início.

**Sessão:** dura 30 dias, num cookie `httpOnly` que o JavaScript da página não lê. Só o servidor do site usa esse cookie para falar com a API.

**Sair:** no perfil, e no topo da página no desktop.

## 5. Player

O player fica fixo no rodapé e continua tocando enquanto a pessoa navega pelo site. Ele tem dois modos.

**Fila de faixas.** Começa ao tocar uma faixa num Disc, no Perfil do artista, na Route, na busca, num Drop ou na Coleção.
- As faixas seguintes da lista entram na fila e tocam na ordem.
- Tem tocar e pausar, faixa anterior, próxima faixa e barra para pular dentro da faixa.
- Faixa anterior volta ao começo da faixa atual se ela já passou dos 3 segundos.
- Clicar de novo na faixa que está tocando pausa.

**Ao vivo.** Começa ao clicar em "Ouvir a rádio" ou "Entrar na sessão" numa House.
- O player pergunta ao servidor qual faixa está no ar e desde quando, e começa a tocar no mesmo ponto em que os outros estão.
- A cada 15 segundos ele confere a posição e corrige se estiver mais de 2 segundos fora.
- Pausar e voltar retoma onde a transmissão está, não onde parou.
- Não tem pular faixa nem barra de posição.
- Quando nada está no ar, mostra "fora do ar" com link para a programação.

**Em ambos os modos:**
- O título leva à página da faixa, o artista ao perfil dele e, ao vivo, o nome da transmissão volta à rádio ou à House.
- A faixa aparece no controle de mídia do sistema (tela bloqueada, fones com botões).
- O X fecha o player.

## 6. Início

`/` é a porta de entrada.

- **Abertura:** "A música conecta pessoas.", com a busca e a capa do Disc em destaque desfocada ao fundo.
- **Em destaque:** cards largos dos Discs em destaque, com o selo Pré-venda ou Em breve. No celular eles rolam para o lado.
- **Houses em alta:** as ao vivo primeiro, ordenadas por quantas pessoas estão dentro, depois as próximas. Mostra até 6. Houses privadas não aparecem.
- **Eydisco Radio:** o programa e a faixa no ar, ou "fora do ar".
- **Discovery Drop:** título e apresentação do Drop mais recente, com link para ele.

## 7. Descobrir (Route) e busca

**Descobrir** (`/descobrir`) é a Route completa:

- Busca e atalho para a rádio.
- **Discovery Drop:** o mais recente, com todas as descobertas (seção 8).
- **Para ouvir agora:** até 8 faixas em destaque, com "Ouvir tudo".
- **Artistas:** até 8, em ordem alfabética.
- **Discs:** os destaques, com link para a lista completa.

**Quem entra em destaque:** é a equipe que escolhe, marcando Discs e faixas como destaque no admin. Discs em pré-venda aparecem antes dos que estão para abrir. Se ninguém for marcado, entram os mais recentes.

**Busca** (`/busca?q=`):
- Pesquisa artistas, Discs e faixas pelo nome. Discs e faixas também aparecem quando o nome do artista bate.
- Precisa de pelo menos 2 letras e traz até 6 resultados de cada tipo.
- As faixas encontradas já tocam dali.

## 8. Discovery Drop

`/drops/[slug]`: uma seleção editorial de 3 a 5 descobertas, com uma apresentação geral.

- **Item do Drop:** cada um aponta para uma coisa só (um artista, um Disc ou uma faixa) e traz um texto curto de por que ouvir.
- **Faixas:** se a descoberta é uma faixa, tem o botão "Ouvir".
- **Publicação:** o Drop só aparece a partir da data de publicação definida no admin. Antes disso a página dá 404.
- **Anteriores:** a página lista os Drops passados no fim.

## 9. Discs

**Lista** (`/discos`): todos os Discs, 20 por página, com filtros Todos, Em pré-venda, Em breve e Lançados.

**Situação de cada Disc:** depende de duas datas cadastradas no admin.

| Situação | Quando | O que aparece |
|---|---|---|
| Em breve | Antes da abertura da pré-venda | Selo "Em breve" e "Pré-venda abre em [data]". Ainda não dá para colecionar. |
| Pré-venda | Entre a abertura e o lançamento | Selo "Pré-venda" e "Chega em [data]" |
| Lançado | Depois do lançamento | O ano. Continua dando para colecionar enquanto houver exemplar. |

**Página do Disc** (`/discos/[slug]`):
- Capa com brilho, título, artista, ano e quantidade de faixas.
- **Botões:**
  - **Ouvir:** toca o Disc inteiro na fila.
  - **Colecionar:** mostra o menor preço. Se houver uma edição só, leva direto à compra; se houver várias, rola até as edições.
  - **House:** aparece quando há uma House aberta ou marcada tocando este Disc.
- **Seus exemplares:** se a pessoa tem exemplares do Disc, eles aparecem com o número ("Estes exemplares são seus") e os conteúdos exclusivos ficam liberados.
- **Descrição e faixas:** a descrição e a lista de faixas, cada uma tocável e com link para o Behind the Track.
- **A história:** como o disco nasceu.
- **Linha do tempo:** "1. Pré-venda abre" e "2. Disco lançado", com as datas.
- **Edições:** para cada uma, o nome (ex.: Vinil laranja translúcido), o preço com o selo "Preço de teste" quando é demonstração, o que vem incluído, a barra da tiragem ("482 disponíveis de 500") e o próximo número livre ("Próximo: #019"). O botão diz "Colecionar", "Esgotada" ou "Ainda não abriu".
- **Conteúdos do Disc:** os extras (veja a seção 12). Os exclusivos aparecem trancados, com "Libera quando você tiver um exemplar", para quem não tem o Disc.

## 10. Colecionar: pré-venda demonstrativa

`/discos/[slug]/comprar?edicao=<id>`. Precisa estar logado; quem não está vai para o login e volta para cá depois.

**A tela:**
- À esquerda, o resumo: capa, Disc, edição, preço e o número que deve ser da pessoa. Se alguém colecionar antes, ela recebe o seguinte.
- À direita, o endereço: nome de quem recebe, CEP, rua, número, complemento, bairro, cidade e estado.
- O CEP completa rua, bairro, cidade e estado sozinho, consultando o ViaCEP. Se o CEP não existir, a tela avisa e deixa preencher à mão.
- O botão diz "Colecionar por R$ X". Numa edição de demonstração, a tela avisa que o preço é de teste e nada é cobrado.

**As regras do número:**
- Cada edição tem uma tiragem (ex.: 500).
- Cada pedido recebe o menor número livre daquela edição. Dois pedidos ao mesmo tempo nunca pegam o mesmo número, porque a edição fica travada durante a reserva.
- Quando a tiragem acaba, a edição aparece como esgotada.
- Antes da abertura da pré-venda não dá para colecionar.
- O preço do pedido é guardado no momento da compra. Se a equipe mudar o preço da edição depois, o pedido não muda.

**Depois de colecionar:**
- A pessoa vai para Pedidos, com a confirmação em destaque: o número grande ("#017 / 500") e "Disc colecionado. Esse número é seu."
- Numa edição de demonstração, a confirmação diz que nada foi cobrado e nenhum disco será enviado.
- O exemplar já aparece na Coleção e libera os conteúdos exclusivos do Disc.

## 11. Pedidos

`/pedidos`, só para a própria pessoa. Lista os pedidos com capa, Disc, artista, edição, número do exemplar, preço, data e situação: Aguardando pagamento, Pago, Enviado, Entregue ou Cancelado. Todo pedido começa como "Aguardando pagamento", e a equipe muda a situação no admin.

## 12. Behind the Track

`/faixas/[slug]`, a camada editorial de cada faixa:

- Capa, título, artista, número da faixa, Disc, duração e "Ouvir a faixa", que continua pelo resto do Disc.
- **Como ela foi feita:** a história de produção.
- **Inspirações.**
- **Créditos:** função e nome (Composição, Produção, Mixagem, Bateria...).
- **Extras da faixa.**
- As outras faixas do Disc, para navegar entre elas.

**Extras** existem no Disc e em cada faixa. São de cinco tipos: texto, vídeo, imagem, áudio ou link. Vídeo, imagem e áudio podem ser arquivo enviado ou link externo. A equipe marca cada extra como aberto a todos ou "só para quem tem o Disc". O conteúdo dos exclusivos nem é enviado para quem não tem o Disc: a pessoa vê só o título e o aviso.

## 13. Perfil do artista

`/artistas/[slug]`:

- Avatar, nome e botão **Seguir** com o número de seguidores. Precisa estar logado; quem não está vai para o login. Clicar de novo deixa de seguir.
- **Biografia.**
- **Discs disponíveis:** em pré-venda ou para abrir.
- **Músicas:** até 10 faixas, das mais recentes, com "Ouvir tudo".
- **Houses:** as abertas ou marcadas com o artista. Privadas não aparecem.
- **Lançamentos:** Discs já lançados.

## 14. Eydisco Radio

`/radio`: programas curados por DJs e artistas, sem precisar de uma rádio automatizada 24 horas.

- **Programa:** é uma lista de faixas com horário de início, cadastrada no admin. Ele termina quando a última faixa acaba.
- **No ar agora:** capa grande da faixa tocando, o programa, quem apresenta (com link para o perfil quando é um artista da casa), o título da faixa (link para o Behind the Track), artista, Disc e a próxima faixa.
- **"Ouvir a rádio":** começa a tocar no mesmo ponto que todo mundo.
- **Atualização:** a página se atualiza sozinha a cada 10 segundos.
- **Lista do programa:** a faixa no ar aparece marcada.
- **Programação:** os próximos 6 programas, com dia, horário e quem apresenta.
- **Fora do ar:** quando não há programa, a página diz quando começa o próximo.

## 15. Houses

Uma House é uma sessão marcada para ouvir um Disc junto. Todo mundo escuta a mesma faixa no mesmo instante, vê quem está na sala, reage e conversa.

### Tipos

| Tipo | Quem entra | Quem cria |
|---|---|---|
| **Pública** | Qualquer pessoa | Qualquer usuário logado |
| **Privada** | Quem tem o link de convite. Depois de entrar uma vez com o link, a pessoa passa a entrar sem ele. | Qualquer usuário logado |
| **Collector** | Quem tem um exemplar do Disc da House (precisa estar logado) | Qualquer usuário logado |
| **Artista** | Qualquer pessoa | Só quem gerencia o artista |

O anfitrião sempre entra na própria House. Houses privadas nunca aparecem em listas públicas: nem no Início, nem em Houses, nem no perfil de quem criou visto por outra pessoa.

**Situação:** uma House está **marcada** antes do horário de início, **ao vivo** enquanto as faixas tocam e **encerrada** quando a última acaba.

### Lista

`/houses`, com três abas:
- **Em andamento:** as Houses ao vivo.
- **Em breve:** as marcadas.
- **Minhas:** as que a pessoa criou ou em que entrou, inclusive privadas e encerradas.

Cada item mostra a foto, o nome, quantas pessoas estão dentro, o tipo (com cadeado nas privadas e collector) e "Agora: [artista], faixa N" ou o horário de início. O botão **Criar** fica no topo.

### Criar House

`/houses/criar`, precisa estar logado.

| Campo | Regras |
|---|---|
| Foto de capa | Opcional. Até 8 MB. Sem foto, a House usa a capa do Disc. |
| Nome | Obrigatório, até 50 caracteres, com contador |
| Mensagem da House | Opcional. Aparece na sala para quem chega. |
| Tipo | Pública, Privada, Collector ou Artista. Artista aparece desabilitado para quem não gerencia nenhum artista. |
| O que vai tocar | Um Disc que já tenha faixas. A House toca o Disc inteiro, em ordem. Numa House Collector, é ter este Disc que dá acesso. |
| Quando | "Começar agora" ou "Programar", com data e hora a partir de agora |

Ao criar, a pessoa vai direto para a sala. O endereço da House é gerado a partir do nome.

### A sala

`/houses/[slug]` (com `?convite=` nas privadas):

- **Topo:** foto da House com o nome, quantas pessoas estão dentro, o tipo, o anfitrião, o artista e os avatares de quem está na sala. Selo Ao vivo, Em breve ou Encerrada.
- **Tocando agora:** capa, faixa, artista, número da faixa, Disc e a barra de progresso com o tempo, calculada pelo relógio do servidor.
  - O botão "Entrar na sessão" começa a tocar no mesmo ponto que os outros. Depois disso ele vira tocar/pausar.
  - Antes do horário, mostra "Começa hoje às 21:00", e o anfitrião vê o botão "Começar agora".
- **Reações:** 🔥 ❤️ 💃 😮 👏.
  - Só funcionam com a sessão ao vivo e para quem está logado.
  - Cada reação sobe flutuando por cima da foto para todo mundo na sala.
  - A animação não aparece para quem desativou animações no sistema.
- **Mensagem da House:** o texto do anfitrião. Numa House privada, o anfitrião vê ali o botão "Copiar link de convite".
- **Conversa:** chat com o nome e o horário de cada mensagem, até 500 caracteres por mensagem. Precisa estar logado. Fecha quando a sessão termina.
- **Pessoas:** quem está na sala, com link para o perfil e o anfitrião marcado.
- **Faixas:** o que vai tocar, com a faixa atual marcada.

**Quem conta como "na sala":** a pessoa logada que entrou na sessão. O site avisa a cada 20 segundos que ela continua ali, e quem não dá sinal há 45 segundos sai da lista. A sala atualiza chat, reações, pessoas e faixa a cada 3 segundos.

**Sem acesso:** quem abre uma House em que não pode entrar vê a foto desfocada com um cadeado e o motivo:
- **Privada:** pedir o link a quem criou.
- **Collector, sem conta:** entrar na conta.
- **Collector, sem o Disc:** um botão para o Disc.

## 16. Coleção

`/colecao` leva à coleção de quem está logado (`/estante/[username]`). A de qualquer pessoa é pública.

**Aba Discs:**
- **Pilha de cartas:** o Disc da frente em destaque, com capa, título e artista em caixa alta espaçada e "EDIÇÃO #127 / 500". Os próximos Discs aparecem como bordas atrás.
- **Navegação:** deslizando para o lado, pelas setas do teclado ou pelos botões. Mostra "1 de 5".
- **Abaixo da carta:** quantidade de faixas, data de aquisição e "Edição limitada" ou "Demonstração".
- **Ouvir:** toca o Disc inteiro.
- **Detalhes:** abre a página do Disc. **Bastidores:** abre o Behind the Track da primeira faixa.
- **Grade:** todos os Discs com o número. Clicar num deles traz ele para a frente da pilha.
- Mostra 20 Discs por página.

**Aba Houses:**
- **Na própria coleção:** as Houses criadas e as que a pessoa entrou, incluindo privadas.
- **Na coleção de outra pessoa:** as que ela criou, menos as privadas.

## 17. Perfil de usuário

`/perfil/[username]`:

- Avatar com as iniciais, nome de usuário e "Colecionador" (quem tem algum Disc) ou "Ouvinte", com o total de Houses.
- **Números:** Discs, Houses criadas e Houses que entrou. Cada um leva à parte certa da coleção.
- **Minhas Houses:** até 6 Houses criadas. Para outras pessoas, só as não privadas.
- **Atividade:** até 12 eventos recentes, com o tempo desde cada um ("2 h", "1 d"). Os eventos são "coletou o álbum X", "criou a House Y" e "entrou na House Z". Entradas em Houses privadas não aparecem para outras pessoas.
- **No próprio perfil:** "Meus pedidos" e "Sair".

## 18. Painel administrativo

Em `/admin/` na API, para a equipe. O que dá para fazer:

| Área | O que se cadastra |
|---|---|
| **Artistas** | Nome, endereço (slug), biografia, avatar, gestores (usuários que podem criar House de artista) e seguidores |
| **Discs** (Releases) | Artista, título, descrição, história, capa, destaque na Route, abertura da pré-venda e lançamento. Na mesma tela: as edições, as faixas e os extras do Disc. |
| **Edições** | Nome, preço, tiragem, o que vem incluído (um item por linha) e se é demonstração |
| **Faixas** (Tracks) | Número, título, arquivo de áudio, destaque na Route, história de produção e inspirações. Na mesma tela: créditos e extras da faixa. A duração é lida do arquivo ao salvar. |
| **Discovery Drops** | Título, apresentação, data de publicação e de 3 a 5 descobertas, cada uma com texto e um alvo (artista, Disc ou faixa) |
| **Programas da rádio** (Shows) | Título, quem apresenta, artista da casa (opcional), descrição, horário de início e a lista de faixas em ordem. Ação **Começar agora**. |
| **Houses** | Tudo o que o site permite, mais escolher o anfitrião e montar a lista de faixas à mão. Ação **Começar agora**. |
| **Pedidos** | Lista com filtro por situação, e a situação editável direto na lista (Aguardando pagamento → Pago → Enviado → Entregue, ou Cancelado) |
| **Exemplares** (Items) | Os números já emitidos de cada edição e quem tem cada um |
| **Usuários** | Contas, senhas e permissões |

## 19. Dados de demonstração

O comando `seed_demo` cria:
- **5 artistas:** Marina Sena, Terno Rei, Luedji Luna, BaianaSystem e Ana Frango Elétrico.
- **6 Discs** em situações diferentes: em breve, em pré-venda e lançados.
- **10 edições, 20 faixas** com créditos, histórias e extras.
- **1 Discovery Drop, 4 programas de rádio e 5 Houses**, uma de cada tipo, mais uma pública extra.
- **18 contas**, com pedidos já feitos para os números não começarem em #1.

As faixas são instrumentais sintetizadas, sem música de terceiros. Capas, avatares e fotos de House foram geradas por `demo/art.py`. Todos esses arquivos ficam em `eydisco-api/demo/assets`. Os textos e títulos são fictícios. Os nomes de artistas reais estão só para a demonstração e devem ser trocados antes de mostrar a qualquer pessoa de fora.

O comando aceita duas opções:
- `--if-empty`: com o banco vazio, cria tudo; com dados, só repõe os arquivos de demonstração que sumiram do disco. É assim que o deploy usa a cada partida.
- `--on-air`: só recoloca a rádio e as Houses de demonstração no ar agora.

## 20. Como a sincronia funciona

Não há servidor de streaming. Um programa da rádio ou uma House é uma lista de faixas com horário de início, e a duração de cada faixa é conhecida.

Quando alguém abre a rádio ou uma House, a API devolve três coisas: qual faixa está tocando, em que instante ela começou e a hora do servidor. O navegador calcula em que segundo da faixa todo mundo está e começa a tocar dali. O arquivo de áudio é servido com suporte a `Range`, o que permite ao navegador pular direto para aquele ponto.

Com isso, duas pessoas em computadores diferentes ficam a uma fração de segundo uma da outra, sem nenhuma conexão permanente.

## 21. O que ainda não existe

Para alinhar expectativa com o cliente:

- **Pagamento real:** a pré-venda é demonstrativa. Os pedidos ficam em "Aguardando pagamento" até a equipe mudar no admin.
- **Recuperar senha por e-mail** e **entrar com Google ou Apple**.
- **Editar a conta:** foto, nome e e-mail. O avatar do usuário é sempre as iniciais.
- **Editar ou apagar House** pelo site. Só pelo admin.
- **Controle do anfitrião durante a sessão:** pular, voltar ou trocar faixa. A House toca o Disc em ordem. Também não há uma House com faixas de vários Discs criada pelo site; pelo admin dá.
- **Moderação do chat:** apagar mensagem, silenciar ou expulsar alguém.
- **Favoritar faixas**, playlists pessoais e histórico do que a pessoa ouviu.
- **Notificações:** por exemplo, avisar quando uma House que a pessoa segue começa ou quando abre uma pré-venda de um artista seguido.
- **Artista publicar o próprio Disc.** Hoje quem cadastra é a equipe, pelo admin.
- **Tempo real por WebSocket.** A House consulta o servidor a cada 3 segundos, o que serve bem para demonstração e grupos pequenos.
- **Busca de Houses.** A busca cobre artistas, Discs e faixas.
- **Storage permanente em produção:** depende de configurar um bucket (veja o README).

## 22. Referência rápida de rotas

| Endereço | O que é | Login |
|---|---|---|
| `/` | Início | Não |
| `/descobrir` | Route | Não |
| `/busca?q=` | Busca | Não |
| `/drops/[slug]` | Discovery Drop | Não |
| `/discos` | Lista de Discs | Não |
| `/discos/[slug]` | Página do Disc | Não |
| `/discos/[slug]/comprar?edicao=<id>` | Colecionar | Sim |
| `/faixas/[slug]` | Behind the Track | Não |
| `/artistas/[slug]` | Perfil do artista | Não; seguir exige login |
| `/radio` | Eydisco Radio | Não |
| `/houses?aba=live\|upcoming\|mine` | Lista de Houses | Não; "Minhas" exige login |
| `/houses/criar` | Criar House | Sim |
| `/houses/[slug]?convite=` | Sala da House | Depende do tipo; reagir e conversar exigem login |
| `/colecao` | Minha coleção | Sim |
| `/estante/[username]` | Coleção de alguém | Não |
| `/perfil/[username]` | Perfil de alguém | Não |
| `/pedidos` | Meus pedidos | Sim |
| `/entrar`, `/cadastro` | Login e cadastro | Não |

Os endpoints da API estão em [eydisco-api/README.md](../eydisco-api/README.md).
