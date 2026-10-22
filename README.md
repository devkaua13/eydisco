# Eydisco

Plataforma para descobrir música, ouvir junto e colecionar discos físicos numerados. Quem usa ouve faixas, entra numa rádio com programação curada, participa de sessões coletivas de escuta (as Houses) e garante o exemplar numerado de um disco na pré-venda. Cada exemplar vai para a coleção da pessoa com o número dele, por exemplo #127/500.

A lista completa do que a aplicação faz, tela por tela, está em [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md).

## O que tem aqui

| Pasta | O que é | Tecnologia |
|---|---|---|
| [`eydisco-api/`](eydisco-api/README.md) | API e painel administrativo | Django 6, Django REST Framework, Postgres (Supabase) ou SQLite |
| [`eydisco-web/`](eydisco-web/README.md) | Site | Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui |
| `render.yaml` | Deploy dos dois no Render | Blueprint do Render |

O navegador só fala com o Next.js. É o servidor do Next que chama a API, levando o token de quem está logado, que fica guardado num cookie que o JavaScript da página não consegue ler.

```
navegador ──> eydisco-web (Next.js) ──> eydisco-api (Django) ──> Postgres
    │                                         │
    └──── faixas e capas (/media/ ou bucket) <─┘
```

## Rodando no computador

Precisa de Python 3.13 com [uv](https://docs.astral.sh/uv/), Node 22 e pnpm.

**API**, em `eydisco-api/`:

```
cp .env.example .env              # sem DATABASE_URL, usa SQLite local
uv sync
uv run python manage.py migrate
uv run python manage.py seed_demo # dados de demonstração (opcional)
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

A API fica em http://localhost:8000 e o admin em http://localhost:8000/admin/.

**Site**, em `eydisco-web/`:

```
cp .env.example .env.local        # API_URL=http://localhost:8000
pnpm install
pnpm dev
```

O site fica em http://localhost:3000.

### Contas de demonstração

O `seed_demo` cria estas contas. A senha é `discos123` no computador e o valor de `DEMO_PASSWORD` em produção.

| Conta | Para que serve |
|---|---|
| `colecionador` | Tem Discs na coleção, entra na House Collector, vê os conteúdos exclusivos e é anfitrião de uma House privada (para testar o convite) |
| `terno.rei` | Gerencia o artista Terno Rei, então é a única que cria House do tipo Artista |
| `fa0` a `fa15` | Contas comuns, para abrir uma segunda janela e testar a sincronia, o convite e o chat |

Os horários da rádio e das Houses de demonstração contam a partir do momento em que o seed rodou. Para colocá-las no ar de novo: `uv run python manage.py seed_demo --on-air`, ou a ação "Começar agora" no admin.

## Testes e verificações

```
# API (força o SQLite mesmo com o .env apontando para o Supabase)
cd eydisco-api && DATABASE_URL=sqlite:///db.sqlite3 uv run python manage.py test

# Site
cd eydisco-web && pnpm typecheck && pnpm lint && pnpm build
```

## Deploy

O `render.yaml` descreve os dois serviços. No Render: **New → Blueprint**, escolha este repositório e preencha:

| Variável | Serviço | Valor |
|---|---|---|
| `DATABASE_URL` | API | URL do Postgres do Supabase, pelo pooler na porta 6543 |
| `DEMO_PASSWORD` | API | Senha das contas de demonstração |
| `API_URL` | Site | Endereço público da API, por exemplo `https://eydisco-api.onrender.com` |

Na primeira partida, a API aplica as migrações e, se o banco estiver vazio, roda o `seed_demo`. Cada `git push` na `main` faz um novo deploy do serviço cuja pasta mudou.

**Arquivos enviados:** faixas, capas e fotos de House ficam em disco, a não ser que `AWS_STORAGE_BUCKET_NAME` esteja configurado. No plano gratuito do Render esse disco é apagado quando o serviço reinicia. Para os arquivos ficarem permanentes, configure um bucket S3, Cloudflare R2 ou Supabase Storage com as variáveis `AWS_*` descritas em `render.yaml`.

**Plano gratuito:** os serviços dormem depois de uns 15 minutos sem acesso, e a primeira visita depois disso demora perto de um minuto.
