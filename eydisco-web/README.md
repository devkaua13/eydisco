# eydisco-web

Frontend do Eydisco em Next.js 16 (App Router) com shadcn/ui. Consome o `eydisco-api`.

## Rodando

Com a API rodando em `http://localhost:8000`:

```
cp .env.example .env.local
pnpm install
pnpm dev
```

Abre em `http://localhost:3000`.

## Como fala com a API

Todas as chamadas saem do servidor do Next (`lib/api.ts`), nunca do navegador. O token do DRF fica num cookie httpOnly (`lib/session.ts`); login, cadastro, sair e comprar são Server Actions (`app/actions.ts`). Por isso o CORS da API não entra em jogo.

| Rota | Página | Endpoint |
|---|---|---|
| `/` | Início: destaques, Houses em alta, rádio, Drop | `GET /api/route/`, `/api/radio/`, `/api/houses/` |
| `/descobrir` | Route: busca, Drop, faixas, artistas, Discs | `GET /api/route/`, `/api/radio/` |
| `/busca?q=` | Busca | `GET /api/search/` |
| `/drops/[slug]` | Discovery Drop | `GET /api/drops/<slug>/` |
| `/discos`, `/discos/[slug]` | Discs e a página do Disc | `GET /api/feed/`, `/api/releases/<slug>/` |
| `/discos/[slug]/comprar?edicao=<id>` | Colecionar (pré-venda demonstrativa) | `POST /api/orders/` |
| `/faixas/[slug]` | Behind the Track | `GET /api/tracks/<slug>/` |
| `/artistas/[slug]` | Perfil do artista | `GET /api/artists/<slug>/`, `/follow/` |
| `/radio` | Eydisco Radio | `GET /api/radio/` |
| `/houses?aba=` | Houses: Em andamento, Em breve, Minhas | `GET /api/houses/?tab=` |
| `/houses/criar` | Criar House | `POST /api/houses/` |
| `/houses/[slug]?convite=` | Sala da House | `/live/`, `/presence/`, `/reactions/`, `/messages/`, `/start/` |
| `/colecao`, `/estante/[username]` | Coleção em pilha, e Houses | `GET /api/users/<username>/shelf/` |
| `/perfil/[username]` | Perfil de quem coleciona | `GET /api/users/<username>/` |
| `/pedidos` | Meus pedidos | `GET /api/orders/` |
| `/entrar`, `/cadastro` | Login e cadastro | `POST /api/auth/token/`, `POST /api/auth/register/` |

## Visual

Tema escuro único com roxo da marca (`--brand`) e ação principal em pílula branca, seguindo as referências do cliente. Tokens em `app/globals.css`; fonte Manrope. No celular a navegação é uma barra de abas (`components/tab-bar.tsx`) e o player fica logo acima dela.

## Player

O player fica no layout raiz (`components/player/`), então a música continua enquanto a pessoa navega. Ele tem dois modos: fila de faixas (Disc, Perfil, Route, busca) e ao vivo (Rádio e House). Ao vivo, ele consulta `/api/radio` ou `/api/houses/[slug]/live` (route handlers do Next que repassam para a API com o token da sessão) e ajusta a posição pelo horário do servidor.

O CEP do checkout é completado pelo ViaCEP, direto do navegador.
# eydisco
