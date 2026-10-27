# 🍔 BurgerTech — Sistema de Pedidos de Hamburgueria

**Autoria: Mariana Capelari**

## 📋 Sobre o projeto

O **BurgerTech** simula o atendimento de uma hamburgueria. O cliente monta um hambúrguer personalizado, pode incluir extras, escolhe uma forma de pagamento e confirma o pedido. Após a confirmação, o pedido entra no histórico da aplicação e a cozinha e o painel de pedidos recebem notificações simuladas.


### 🎯 Objetivo

Demonstrar o uso consciente de padrões das três categorias estudadas:

- **Criacionais:** Builder e Singleton.
- **Estruturais:** Decorator.
- **Comportamentais:** Strategy e Observer.

## ✨ Funcionalidades

- Seleção do tipo de pão: **Brioche, Australiano ou Tradicional**.
- Seleção do tipo de carne: **Bovina, Frango ou Suína**.
- Escolha dos ingredientes opcionais: **queijo, salada e molho**.
- Inclusão de extras: **bacon, cheddar e ovo**.
- Cálculo do preço conforme os ingredientes escolhidos.
- Pagamento simulado por **PIX, cartão ou dinheiro**, com **5% de desconto no PIX**.
- Resumo do pedido antes da confirmação.
- **Fluxo obrigatório por etapas**, impedindo a confirmação sem montagem e pagamento.
- Possibilidade de voltar para alterar o pagamento ou cancelar o pedido.
- Notificação simulada à cozinha e ao painel após a confirmação.
- Histórico dos pedidos confirmados e histórico de logs.

## 🔄 Como funciona o atendimento

```text
INÍCIO
  |
  v
1. MONTAGEM DO LANCHE
   Escolher pão, carne e ingredientes opcionais
  |
  v
2. ADICIONAIS
   Incluir extras ou continuar sem extras
  |
  v
3. PAGAMENTO
   Escolher PIX, cartão ou dinheiro
  |
  v
4. CONFERÊNCIA
   Ver resumo, confirmar, alterar pagamento ou cancelar
  |
  v
5. PEDIDO CONFIRMADO
   Registrar no histórico e notificar cozinha e painel
  |
  v
VOLTAR AO INÍCIO
```

O menu apresenta as opções adequadas à **etapa atual**. Após a confirmação ou cancelamento, o pedido atual é limpo, e um novo atendimento pode começar. As opções de consultar pedidos anteriores e logs estão disponíveis durante a navegação.

## 🧱 Padrões de Projeto implementados

### 1. Builder — Criacional

**Arquivo:** `src/builder/LancheBuilder.ts`  
**Classes:** `LancheBuilder` e `Lanche`.

**Problema:** um lanche pode ter diferentes combinações de ingredientes. Passar várias opções booleanas diretamente ao construtor tornaria a construção pouco clara.

**Solução:** o `LancheBuilder` recebe os ingredientes obrigatórios (pão e carne), adiciona ingredientes opcionais pelos métodos `comQueijo()`, `comSalada()` e `comMolho()` e finaliza com `build()`.

```typescript
const lanche = new LancheBuilder('Brioche', 'Bovina')
  .comQueijo()
  .comMolho()
  .build();
```

**Justificativa:** organiza a criação do objeto passo a passo, facilita a personalização e evita construtores com muitos parâmetros opcionais.

### 2. Decorator — Estrutural

**Arquivo:** `src/decorator/Adicionais.ts`  
**Interface/classe abstrata:** `Item` e `ItemDecorator`.  
**Decoradores concretos:** `BaconDecorator`, `CheddarDecorator` e `OvoDecorator`.

**Problema:** cada combinação de extras poderia exigir uma classe própria, multiplicando a quantidade de classes.

**Solução:** cada decorador envolve um objeto `Item` e acrescenta sua descrição e seu preço sem modificar a classe original do lanche.

```typescript
let item: Item = new LancheBuilder('Brioche', 'Frango').build();
item = new BaconDecorator(item);
item = new CheddarDecorator(item);
```

**Justificativa:** permite combinar extras dinamicamente, reaproveitando o mesmo contrato (`Item`) e evitando uma classe para cada combinação.

### 3. Strategy — Comportamental

**Arquivo:** `src/strategy/Pagamentos.ts`  
**Interface:** `EstrategiaPagamento`.  
**Estratégias concretas:** `PagamentoPix`, `PagamentoCartao` e `PagamentoDinheiro`.  
**Contexto:** `Caixa`.

**Problema:** as regras de cálculo variam conforme o meio de pagamento. Colocar todas elas dentro do caixa aumentaria o acoplamento.

**Solução:** cada classe implementa `calcularTotal()`. O `Caixa` utiliza a estratégia selecionada sem precisar conhecer sua lógica interna.

```typescript
const caixa = new Caixa(new PagamentoPix());
const resultado = caixa.fecharConta(40);
// Total fictício com desconto: R$ 38,00
```

**Justificativa:** permite trocar as regras de pagamento sem alterar a classe `Caixa`. Neste projeto, o PIX concede **5% de desconto**, enquanto cartão e dinheiro não têm acréscimo.

### 4. Observer — Comportamental

**Arquivo:** `src/observer/Notificacoes.ts`  
**Interface:** `Observador`.  
**Publicador:** `CentralPedidos`.  
**Observadores concretos:** `Cozinha` e `PainelPedidos`.

**Problema:** quando um pedido é confirmado, diferentes partes do sistema precisam saber do acontecimento.

**Solução:** a central mantém observadores inscritos. Ao chamar `notificar()`, cada observador recebe a mensagem pelo método `atualizar()`.

```typescript
const central = new CentralPedidos();
central.inscrever(new Cozinha());
central.inscrever(new PainelPedidos());
central.notificar('Pedido #1 confirmado.');
```

**Justificativa:** desacopla o processo de confirmação das classes responsáveis pelas notificações. As mensagens são exibidas no terminal; **não há envio real de SMS ou e-mail**.

### 5. Singleton — Criacional

**Arquivo:** `src/singleton/LoggerService.ts`  
**Classe:** `LoggerService`.

**Problema:** diferentes partes do programa precisam registrar eventos em um histórico compartilhado, sem criar registradores independentes.

**Solução:** o construtor de `LoggerService` é privado, e o acesso ocorre por `getInstance()`, que reutiliza a única instância. O histórico guarda **até cinco registros**; ao ultrapassar esse limite, remove o registro mais antigo (**FIFO — First In, First Out**).

```typescript
const logger = LoggerService.getInstance();
logger.log('INFO', 'Pedido confirmado');
logger.imprimirHistorico();
```

**Justificativa:** centraliza o registro dos eventos do sistema e permite compartilhar o mesmo histórico entre os módulos.

### 📌 Resumo dos padrões

| Padrão | Categoria | Onde é aplicado | Principal benefício |
|---|---|---|---|
| Builder | Criacional | `src/builder/LancheBuilder.ts` | Montagem personalizada em etapas |
| Decorator | Estrutural | `src/decorator/Adicionais.ts` | Combinação flexível de extras |
| Strategy | Comportamental | `src/strategy/Pagamentos.ts` | Diferentes cálculos de pagamento |
| Observer | Comportamental | `src/observer/Notificacoes.ts` | Notificação desacoplada de setores |
| Singleton | Criacional | `src/singleton/LoggerService.ts` | Histórico centralizado de logs |

## 💻 Recursos do TypeScript utilizados

| Recurso | Exemplo no projeto | Finalidade |
|---|---|---|
| Interfaces | `Item`, `EstrategiaPagamento`, `Observador`, `Pedido` | Definem contratos para as classes |
| Classes | `LancheBuilder`, `Caixa`, `CentralPedidos` | Organizam comportamentos e dados |
| Classe abstrata | `ItemDecorator` | Compartilha a implementação básica dos decoradores |
| `enum` | `StatusPedido` e `EtapaPedido` (no `index.ts`) | Representam situações definidas do pedido |
| Genéricos | `Historico<T>` | Permitem armazenar registros de tipos compatíveis |
| Tipo utilitário | `Pick<Pedido, ...>` em `ResumoPedido` | Seleciona propriedades de um tipo existente |
| Tipos literais | `NivelLog` | Restringe os níveis a `INFO`, `WARN` e `ERROR` |
| `async`/`await` | Funções de leitura do menu | Esperam as escolhas digitadas no terminal |

## 📁 Estrutura do projeto

```text
burgertech/
├── src/
│   ├── builder/
│   │   └── LancheBuilder.ts
│   ├── decorator/
│   │   └── Adicionais.ts
│   ├── strategy/
│   │   └── Pagamentos.ts
│   ├── observer/
│   │   └── Notificacoes.ts
│   ├── singleton/
│   │   └── LoggerService.ts
│   ├── models/
│   │   └── Pedido.ts
│   ├── index.ts
│   ├── testes.ts
│   └── testesMenu.ts
├── .editorconfig
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

**`src/index.ts`** integra os módulos, recebe as escolhas do cliente e controla o fluxo por etapas. **`src/testes.ts`** verifica as regras dos módulos e chama **`src/testesMenu.ts`**, que executa o menu em processos controlados, responde às perguntas e verifica as saídas. Cada sessão de teste tem limite de 15 segundos. **`package.json`** define dependências e comandos; **`tsconfig.json`** habilita a tipagem estrita. O `.editorconfig` padroniza a edição dos arquivos.

## 🚀 Como instalar e executar

### Tecnologias

- **TypeScript**, com compilação em modo estrito para JavaScript ES2022.
- **Node.js**, com módulos nativos para leitura do terminal, asserções e processos de teste.
- **npm**, para instalação reproduzível e scripts de compilação, execução e testes.
- **`@types/node`**, para tipagem das APIs do Node.js.

A aplicação não usa frameworks nem dependências de produção.

### Pré-requisitos

- Node.js instalado (recomendado: **20 ou superior**).
- npm, normalmente instalado junto com o Node.js.
- Editor de código, como o Visual Studio Code (opcional).

### Passo 1 — Abrir o projeto

Baixe ou extraia o projeto e abra a pasta `burgertech` no terminal. Se estiver no VS Code, utilize **Terminal → Novo Terminal**.

### Passo 2 — Instalar dependências

```bash
npm ci
```

### Passo 3 — Executar a aplicação

```bash
npm start
```

O comando compila o TypeScript e inicia o menu interativo. Digite o número de cada opção e pressione **Enter**.

### Passo 4 — Executar os testes

```bash
npm test
```

### Outros comandos úteis

```bash
npm run build      # Compila o TypeScript
npm run typecheck  # Verifica tipos sem gerar arquivos
npx tsc --noEmit   # Verifica tipos sem gerar arquivos
```

## 🧪 Roteiro para demonstrar ao professor

1. Execute `npm start` e mostre que a primeira etapa é a montagem.
2. Selecione **pão Brioche**, **carne Bovina** e **queijo**.
3. Acrescente **bacon** e **cheddar** e observe a atualização da descrição e do preço.
4. Continue para o pagamento e escolha **PIX** para demonstrar o desconto de 5%.
5. Confira o resumo e confirme o pedido.
6. Observe as mensagens da **cozinha** e do **painel de pedidos**.
7. Consulte o histórico de pedidos e os logs.
8. Execute `npm test` para mostrar os testes das regras principais.

**Exemplo de cálculo com essas escolhas:** lanche base R$ 20,00 + queijo R$ 3,00 + bacon R$ 6,00 + cheddar R$ 4,00 = **R$ 33,00**. Com desconto fictício de 5% no PIX, o total é **R$ 31,35**.

## ⚠️ Limitações da aplicação

O BurgerTech é um projeto **didático**, executado no terminal:

- Não realiza cobranças financeiras reais.
- Não envia notificações externas: cozinha e painel recebem mensagens no próprio terminal.
- Não utiliza banco de dados; pedidos e logs são mantidos em memória e perdidos quando o programa é encerrado.
- O histórico do Singleton armazena somente os **cinco registros de log mais recentes**.
- Os preços e descontos são valores simulados para fins acadêmicos.
- Os testes automatizados verificam os módulos e cenários de navegação: entradas inválidas, bloqueio de etapas, extras, desconto PIX, troca de pagamento, confirmação, notificações, histórico e cancelamento. O roteiro manual complementa essa cobertura.

## Preparação para GitHub

Mantenha `package-lock.json` no repositório para reproduzir as dependências com `npm ci`. O `.gitignore` exclui dependências, saída compilada, logs, arquivos temporários, configurações locais de editores e arquivos `.env`. Um eventual `.env.example` pode ser versionado com valores fictícios.

O projeto não precisa de credenciais ou variáveis de ambiente. Antes de publicar, confira os arquivos preparados com `git status` e `git diff --cached`. O `.gitignore` não remove arquivos que já estejam versionados. A opção `private: true` no `package.json` evita publicação acidental no registro npm e permite hospedar o código no GitHub normalmente.

## 📚 Referências de estudo

Conceitos e exemplos trabalhados nos materiais disponibilizados na disciplina:

- *Padrões de Projeto — Introdução*.
- *Builder*.
- *Padrão Decorator*.
- *Padrão Strategy*.
- *Padrão Observer*.
- *Singleton*.

---

**Projeto acadêmico — Disciplina de Padrões de Projeto**  
**Linguagem:** TypeScript  
**Aplicação:** BurgerTech 🍔
