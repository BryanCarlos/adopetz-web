# Adopetz Web

Vitrine e gerenciamento de adoção em Angular 22 com Spartan UI e a paleta #03045E, #023EBA, #00B4D8, #CAF0F8 e #FBB02D.

## Executar

```sh
npm install
npm start
```

Abra http://localhost:4200. O Angular encaminha `/api/**` para a API Docker HTTPS em https://localhost:8081, usando `proxy.conf.json`. Reinicie `ng serve` depois de alterar o proxy. `secure: false` nesse arquivo vale apenas para a conexão do proxy de desenvolvimento com o certificado local; a configuração não integra o build de produção.

```sh
npm run build
npm test -- --watch=false
```

Em produção, sirva a aplicação por HTTPS e configure um reverse proxy de `/api` para a API, removendo esse prefixo do caminho. O frontend usa `/api` em `src/app/core/config/api.ts`. Essa configuração mantém as chamadas e o cookie na mesma origem. Se o frontend e a API forem hospedados em domínios diferentes, será necessário revisar CORS e as regras do cookie.

## Organização

```text
src/app/
  core/
    config/          # Prefixo da API
    models/          # Contratos públicos, de gerenciamento e paginação
    services/        # Comunicação HTTP e ciclo de vida da sessão
    guards/          # Login obrigatório e proteção de alterações não salvas
    interceptors/    # Bearer token, renovação e repetição única após 401
    utils/           # Mensagens de erro em português
  features/
    showcase/
      pages/         # Página pública e busca
      components/    # Hero e card com carrossel e contatos
    auth/
      pages/         # Login da ONG
      components/    # Troca da senha inicial
    management/
      pages/
        pets/        # Listagem, status de adoção e exclusão
        pet-editor/  # Cadastro/edição, fotos e vacinas
  shared/components/ # Header, ícones, paginação e confirmação de exclusão
  app.*              # Shell e rotas carregadas sob demanda
```

Os componentes Helm do Spartan permanecem em `libs/ui`. Botões usam Helm; popovers e diálogos de confirmação usam Brain, incluindo navegação por teclado e retorno do foco.

## Gerenciamento

- `/ong`: lista apenas os pets da ONG autenticada, com paginação, edição, status de adoção e exclusão confirmada.
- `/ong/novo`: cadastro de nome, descrição, raça, idade, data de resgate, até quatro fotos e registros de vacinação.
- `/ong/:id/editar`: edição do cadastro, status, inclusão/exclusão de fotos e inclusão/edição/exclusão de vacinas.
- Cada foto deve ser JPEG, PNG, WebP ou AVIF e ter até 10 MB. Os limites também são validados na API.
- Em novos cadastros, fotos e vacinas são enviadas com o cadastro. Em edições, fotos e vacinas são salvas separadamente; a tela informa esse comportamento.
- Uploads de novas fotos na edição são sequenciais. Se uma foto falhar, somente as ainda não enviadas ficam selecionadas para nova tentativa. Atualizar as fotos ou vacinas não descarta os dados ainda não salvos do formulário.
- A idade aceita inteiros de 0 a 99; 0 significa menos de um ano. Campos opcionais podem ficar vazios.
- O usuário recebe um aviso antes de sair com alterações não salvas. Pets adotados deixam de aparecer na vitrine pública.
- O primeiro acesso pode exigir troca da senha inicial. Após a troca, o frontend renova o token para atualizar a sessão.

A API protege os handlers por proprietário e agora também filtra a consulta paginada de meus pets por `UserId`. A interface não permite escolher a ONG proprietária.

## Sessão

- O JWT de acesso fica exclusivamente em memória, em um signal privado exposto para leitura. Não há uso de localStorage ou sessionStorage para autenticação.
- O refresh token permanece no cookie da API: HttpOnly, Secure e SameSite=Strict. O JavaScript não lê esse cookie.
- Ao abrir ou recarregar a aplicação, a sessão é restaurada por `POST /users/auth/refresh-token`.
- Quando `exp` está disponível, o frontend agenda renovação um minuto antes da expiração. `exp` serve apenas para agendamento; a API valida assinatura e autorização.
- Em uma resposta 401 de autenticação, o interceptor compartilha uma renovação entre as chamadas concorrentes e repete cada requisição uma única vez. Um novo 401 encerra a sessão.
- Erro de senha atual não inicia renovação nem encerra a sessão. Falhas temporárias de rede preservam o token atual e agendam outra tentativa em 30 segundos.
- Web Locks serializa login, renovação e logout entre abas quando a API do navegador está disponível. Em navegadores sem esse recurso, a deduplicação continua funcionando dentro de cada aba.
- O logout espera a renovação em andamento, revoga o refresh token pela API e então limpa o JWT em memória. Falha de rede no logout é mostrada ao usuário, que pode tentar novamente.

Guardar um JWT em memória reduz sua persistência/exposição, mas um JWT válido continua sendo uma credencial de acesso. A segurança de acesso a cada pet depende da assinatura do JWT e das verificações de proprietário feitas na API.

## Verificações

Testes do frontend cobrem renovação concorrente, temporizador, expiração, erros de rede, logout durante rotação, guard, carrossel, contatos, multipart e preservação de uploads/formulários. Testes HTTP usam respostas simuladas e não alteram dados reais.

Na pasta `adopetz-api`, execute `dotnet run --project tests/Adopetz.Api.RegressionTests` para validar limites de idade, isolamento das ONGs, o filtro de paginação, datas de vacinação e status HTTP de erros. Essas verificações não acessam o banco.

A vitrine usa os dados reais de `GET /pets`, com busca e paginação de nove itens. A API ainda não retorna espécie nem sexo e informa idade somente em anos. Vacinas registradas não significam vacinação em dia. A fotografia decorativa do banner usa uma URL do Unsplash; as fotos dos cards vêm da API.
