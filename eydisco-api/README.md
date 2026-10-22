# eydisco-api

API Django do Eydisco: Route (descoberta e busca), Eydisco Radio, Houses (sessões coletivas), Perfil do artista, Disc (pré-venda demonstrativa), Estante, Discovery Drop e Behind the Track.

## Rodando

```
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

Admin em `/admin/`. Testes (no SQLite, mesmo com o `.env` apontando para o Supabase): `DATABASE_URL=sqlite:///db.sqlite3 uv run python manage.py test`.

Configuração em `.env` (veja `.env.example`). Sem `DATABASE_URL`, a API usa o SQLite local. Dados de demonstração: `uv run python manage.py seed_demo`.

Variáveis de ambiente (todas com padrão de desenvolvimento): `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` (padrão `http://localhost:3000`).

## Endpoints

Autenticação por token: `Authorization: Token <token>`.

| Método | Rota | Para quê | Login |
|---|---|---|---|
| GET | `/api/route/` | Route: Discs em destaque, faixas, artistas e o Drop mais recente | não |
| GET | `/api/search/?q=` | Busca por artista, Disc e faixa (mínimo 2 letras) | não |
| GET | `/api/drops/`, `/api/drops/<slug>/` | Discovery Drops publicados | não |
| GET | `/api/feed/?status=upcoming\|presale\|released` | Lista de Discs | não |
| GET | `/api/releases/<slug>/` | Disc: edições, faixas, história, extras e `my_items` | não |
| GET | `/api/tracks/<slug>/` | Faixa com Behind the Track (créditos, história, inspirações, extras) | não |
| GET | `/api/artists/<slug>/` | Perfil: bio, Discs, músicas, seguidores e Houses | não |
| POST, DELETE | `/api/artists/<slug>/follow/` | Seguir e deixar de seguir | sim |
| GET | `/api/radio/` | Programa no ar, faixa atual e programação | não |
| GET | `/api/radio/shows/<slug>/` | Programa com a lista de faixas | não |
| GET | `/api/houses/?tab=live\|upcoming\|mine` | Houses (privadas só aparecem em `mine`) | não |
| POST | `/api/houses/` | Criar House (multipart): `title`, `description`, `visibility` (`public`, `private`, `collector`, `artist`), `release` (slug do Disc que vai tocar), `starts_at` opcional, `cover` opcional | sim |
| GET | `/api/houses/<slug>/?code=` | House com `access.can_enter`, `is_host` e, para o anfitrião, `invite_code` | não |
| GET | `/api/houses/<slug>/live/?after_reaction=&after_message=` | Estado da sala: faixa atual, participantes, reações e chat novos | não |
| POST | `/api/houses/<slug>/presence/` | Sinal de presença na sala | sim |
| POST | `/api/houses/<slug>/reactions/`, `/messages/` | Reagir (`emoji`) e conversar (`text`) | sim |
| POST | `/api/houses/<slug>/start/` | Anfitrião começa a sessão antes do horário | sim |
| GET | `/api/users/<username>/` | Perfil: contadores, Houses criadas e atividade | não |
| GET | `/api/users/<username>/shelf/` | Coleção (Estante), com as faixas de cada Disc | não |
| GET, POST | `/api/orders/` | Meus pedidos / comprar na pré-venda | sim |
| POST | `/api/auth/register/` | Cadastro, devolve o token | não |
| POST | `/api/auth/token/` | Login (`username`, `password`), devolve o token | não |
| GET, PATCH | `/api/auth/me/` | Usuário logado | sim |

Comprar: `POST /api/orders/` com `edition` (id) e o endereço (`recipient_name`, `postal_code`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`). A compra reserva o próximo número livre da edição (#1/500, #2/500...) e cria o pedido com status `pending`. Edições com `is_demo` (o padrão) são pré-venda demonstrativa: preço de teste, nada é cobrado, e o item aparece como demonstração na Estante.

## Rádio e Houses sincronizadas

Não há servidor de streaming. Um programa da rádio ou uma House é uma lista de faixas com horário de início (`releases/playback.py`). O endpoint devolve a faixa atual, `track_started_at` e `server_time`, e o navegador calcula a posição; assim todo mundo ouve o mesmo trecho. A duração de cada faixa é lida do arquivo ao salvar (mutagen).

Em desenvolvimento o `/media/` é servido por `config/media.py`, que aceita `Range`: sem isso o navegador não consegue pular para o meio da faixa. Em produção, sirva o `/media/` pelo servidor web ou storage, que já aceitam `Range`.

## Tipos de House

- **Pública:** qualquer pessoa entra.
- **Privada:** entra quem abre o link com `?code=<invite_code>`; ao mandar presença com o código, a pessoa passa a ter acesso sem ele.
- **Collector:** entra quem tem um exemplar do Disc da House.
- **Artista:** aberta, mas só quem está em `managers` do artista pode criar.

O anfitrião sempre entra. Os endpoints da sala (`live`, `presence`, `reactions`, `messages`, `start`) respondem 403 para quem não pode entrar.

## Conteúdo pelo admin

Faixas, créditos e extras ficam no Disc (`Releases`) e em `Tracks`. Extras marcados como "só para quem tem o Disc" chegam trancados para quem não tem um exemplar. Drops, programas da rádio e Houses têm admin próprio; as Houses são programadas pela equipe por enquanto.
