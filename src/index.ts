import { createInterface } from 'node:readline/promises';
import { stdin as entrada, stdout as saida } from 'node:process';
import { LancheBuilder } from './builder/LancheBuilder';
import { Item, BaconDecorator, CheddarDecorator, OvoDecorator } from './decorator/Adicionais';
import { Caixa, EstrategiaPagamento, PagamentoPix, PagamentoCartao, PagamentoDinheiro } from './strategy/Pagamentos';
import { CentralPedidos, Cozinha, PainelPedidos } from './observer/Notificacoes';
import { LoggerService } from './singleton/LoggerService';
import { Historico, Pedido, ResumoPedido, StatusPedido } from './models/Pedido';

// ==========================================
// CONFIGURAÇÃO DO SISTEMA
// ==========================================
const rl = createInterface({
  input: entrada,
  output: saida
});
const logs = LoggerService.getInstance();
const central = new CentralPedidos();
central.inscrever(new Cozinha());
central.inscrever(new PainelPedidos());
const historico = new Historico<Pedido>();

// ==========================================
// CONTROLE DAS ETAPAS DO PEDIDO
// ==========================================
enum EtapaPedido {
  MONTAGEM = 'MONTAGEM',
  ADICIONAIS = 'ADICIONAIS',
  PAGAMENTO = 'PAGAMENTO',
  CONFIRMACAO = 'CONFIRMACAO'
}
let etapa: EtapaPedido = EtapaPedido.MONTAGEM;
let item: Item | null = null;
let pagamento: EstrategiaPagamento | null = null;
let proximoId = 1;

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function dinheiro(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

async function perguntar(texto: string): Promise<string> {
  return (await rl.question(texto)).trim();
}

async function simNao(pergunta: string): Promise<boolean> {
  while (true) {
    const resposta = (await perguntar(`${pergunta} (s/n): `)).toLowerCase();
    if (resposta === 's') {
      return true;
    }
    if (resposta === 'n') {
      return false;
    }
    console.log('Digite s para sim ou n para não.');
  }
}

async function escolherOpcao(titulo: string, opcoes: string[]): Promise<string | null> {
  while (true) {
    console.log(`\n${titulo}`);
    opcoes.forEach((opcao, indice) => {
      console.log(`${indice + 1} - ${opcao}`);
    });
    console.log('0 - Cancelar');
    const resposta = await perguntar('\nDigite a opção desejada: ');
    if (resposta === '0') {
      return null;
    }
    const numero = Number(resposta);
    if (resposta !== '' &&
      Number.isInteger(numero) &&
      numero >= 1 &&
      numero <= opcoes.length) {
      return opcoes[numero - 1];
    }
    console.log('Opção inválida. Tente novamente.');
  }
}

function mostrarItem(): void {
  if (!item) {
    console.log('Nenhum lanche montado.');
    return;
  }
  console.log('\n===== SEU LANCHE =====');
  console.log(item.getDescricao());
  console.log(`Subtotal: ${dinheiro(item.getPreco())}`);
}

function reiniciarPedido(): void {
  item = null;
  pagamento = null;
  etapa = EtapaPedido.MONTAGEM;
}

// ==========================================
// PADRÃO BUILDER - MONTAGEM DO LANCHE
// ==========================================

async function montar(): Promise<void> {
  const pao = await escolherOpcao('===== ESCOLHA O TIPO DE PÃO =====', [
    'Brioche',
    'Australiano',
    'Tradicional'
  ]);
  if (pao === null) {
    console.log('Montagem cancelada.');
    return;
  }
  const carne = await escolherOpcao('===== ESCOLHA O TIPO DE CARNE =====', [
    'Bovina',
    'Frango',
    'Suína'
  ]);
  if (carne === null) {
    console.log('Montagem cancelada.');
    return;
  }
  const builder = new LancheBuilder(pao, carne);
  if (await simNao('Adicionar queijo?')) {
    builder.comQueijo();
  }
  if (await simNao('Adicionar salada?')) {
    builder.comSalada();
  }
  if (await simNao('Adicionar molho?')) {
    builder.comMolho();
  }
  item = builder.build();
  pagamento = null;
  etapa = EtapaPedido.ADICIONAIS;
  logs.log('INFO', 'Lanche montado com sucesso');
  console.log('\nLanche montado com sucesso!');
  mostrarItem();
}

// ==========================================
// PADRÃO DECORATOR - ADICIONAIS
// ==========================================

async function adicionarExtra(): Promise<void> {
  if (etapa !== EtapaPedido.ADICIONAIS || !item) {
    console.log('Monte um lanche primeiro.');
    return;
  }
  console.log('\n===== ADICIONAIS =====');
  console.log('1 - Bacon (+ R$ 6,00)');
  console.log('2 - Cheddar (+ R$ 4,00)');
  console.log('3 - Ovo (+ R$ 3,00)');
  console.log('0 - Voltar');
  console.log('Escolha um ou mais adicionais separados por vírgula (ex.: 1, 2, 3).');
  const opcao = await perguntar('\nDigite a opção desejada: ');
  if (opcao === '0') {
    return;
  }
  const opcoes = opcao.split(',').map(valor => valor.trim());
  if (opcoes.some(valor => !['1', '2', '3'].includes(valor))) {
    console.log('Opção inválida. Use 1, 2 ou 3 separados por vírgula.');
    return;
  }
  for (const adicional of opcoes) {
    switch (adicional) {
    case '1':
      item = new BaconDecorator(item);
      break;
    case '2':
      item = new CheddarDecorator(item);
      break;
    case '3':
      item = new OvoDecorator(item);
      break;
    }
  }
  logs.log('INFO', 'Adicional incluído no lanche');
  console.log('\nAdicional incluído!');
  mostrarItem();
}

// ==========================================
// PADRÃO STRATEGY - PAGAMENTO
// ==========================================

async function escolherPagamento(): Promise<void> {
  if (etapa !== EtapaPedido.PAGAMENTO || !item) {
    console.log('Conclua a montagem primeiro.');
    return;
  }
  console.log('\n===== FORMAS DE PAGAMENTO =====');
  console.log('1 - PIX (5% de desconto)');
  console.log('2 - Cartão');
  console.log('3 - Dinheiro');
  console.log('0 - Voltar aos adicionais');
  const opcao = await perguntar('\nDigite a opção desejada: ');
  switch (opcao) {
    case '1':
      pagamento = new PagamentoPix();
      break;
    case '2':
      pagamento = new PagamentoCartao();
      break;
    case '3':
      pagamento = new PagamentoDinheiro();
      break;
    case '0':
      etapa = EtapaPedido.ADICIONAIS;
      return;
    default:
      console.log('Opção inválida.');
      return;
  }
  etapa = EtapaPedido.CONFIRMACAO;
  logs.log('INFO', `Forma de pagamento escolhida: ${pagamento.nome}`);
  mostrarResumo();
}

// ==========================================
// RESUMO DO PEDIDO
// ==========================================

function mostrarResumo(): void {
  if (!item || !pagamento) {
    return;
  }
  const resultado = new Caixa(pagamento)
    .fecharConta(item.getPreco());
  console.log('\n===== RESUMO DO PEDIDO =====');
  console.log(`Lanche: ${item.getDescricao()}`);
  console.log(`Subtotal: ${dinheiro(item.getPreco())}`);
  console.log(`Pagamento: ${resultado.forma}`);
  console.log(`Total a pagar: ${dinheiro(resultado.total)}`);
}

// ==========================================
// FINALIZAÇÃO DO PEDIDO
// ==========================================

function finalizar(): void {
  if (etapa !== EtapaPedido.CONFIRMACAO ||
    !item ||
    !pagamento) {
    console.log('Conclua todas as etapas antes de finalizar.');
    return;
  }
  const resultado = new Caixa(pagamento)
    .fecharConta(item.getPreco());
  const pedido: Pedido = {
    id: proximoId++,
    item,
    total: resultado.total,
    status: StatusPedido.CONFIRMADO
  };
  historico.adicionar(pedido);
  logs.log('INFO', `Pedido #${pedido.id} confirmado: ${dinheiro(pedido.total)}`);
  console.log('\n\n========================================');
  console.log('          PEDIDO CONFIRMADO');
  console.log('========================================\n');
  console.log(`Pedido #${pedido.id}\n`);
  console.log(`Lanche: ${pedido.item.getDescricao()}\n`);
  console.log(`Pagamento: ${resultado.forma}\n`);
  console.log(`Total: ${dinheiro(pedido.total)}\n`);
  console.log('----------------------------------------');
  console.log('Notificações do pedido\n');
  // PADRÃO OBSERVER
  central.notificar(`Pedido #${pedido.id} confirmado.`);
  console.log('\n========================================\n');
  // Reinicia para o próximo cliente
  reiniciarPedido();
}

// ==========================================
// HISTÓRICO DE PEDIDOS
// ==========================================

function exibirResumoPedido(resumo: ResumoPedido): void {
  console.log(`\nPedido #${resumo.id}`);
  console.log(`Total: ${dinheiro(resumo.total)}`);
  console.log(`Status: ${resumo.status}`);
}

function listarPedidos(): void {
  console.log('\n===== PEDIDOS CONFIRMADOS =====');
  const pedidos = historico.listar();
  if (pedidos.length === 0) {
    console.log('Nenhum pedido confirmado.');
    return;
  }
  for (const pedido of pedidos) {
    const resumo: ResumoPedido = {
      id: pedido.id,
      total: pedido.total,
      status: pedido.status
    };
    exibirResumoPedido(resumo);
    console.log(pedido.item.getDescricao());
  }
}

// ==========================================
// MENU PRINCIPAL COM CONTROLE DE ETAPAS
// ==========================================

async function main(): Promise<void> {
  try {
    while (true) {
      console.log('\n===== BURGERTECH =====');
      // ETAPA 1 - MONTAGEM
      if (etapa === EtapaPedido.MONTAGEM) {
        console.log('\n===== MONTAGEM =====');
        console.log('1 - Montar lanche');
      }
      // ETAPA 2 - ADICIONAIS
      else if (etapa === EtapaPedido.ADICIONAIS) {
        console.log('\n===== ADICIONAIS =====');
        mostrarItem();
        console.log('1 - Adicionar extras');
        console.log('2 - Continuar para pagamento');
        console.log('3 - Cancelar pedido');
      }
      // ETAPA 3 - PAGAMENTO
      else if (etapa === EtapaPedido.PAGAMENTO) {
        console.log('\n===== PAGAMENTO =====');
        console.log('1 - Escolher forma de pagamento');
        console.log('2 - Voltar aos adicionais');
        console.log('3 - Cancelar pedido');
      }
      // ETAPA 4 - CONFIRMAÇÃO
      else if (etapa === EtapaPedido.CONFIRMACAO) {
        console.log('\n===== CONFIRMAÇÃO =====');
        mostrarResumo();
        console.log('1 - Confirmar pedido');
        console.log('2 - Alterar pagamento');
        console.log('3 - Cancelar pedido');
      }
      console.log('\n===== OUTRAS OPÇÕES =====');
      console.log('8 - Consultar pedidos anteriores');
      console.log('9 - Consultar logs');
      console.log('0 - Sair');
      const opcao = await perguntar('\nDigite a opção desejada: ');
      if (opcao === '0') {
        console.log('Até logo!');
        return;
      }
      if (opcao === '8') {
        listarPedidos();
        continue;
      }
      if (opcao === '9') {
        logs.imprimirHistorico();
        continue;
      }
      // CONTROLE DE NAVEGAÇÃO
      switch (etapa) {
        case EtapaPedido.MONTAGEM:
          if (opcao === '1') {
            await montar();
          } else {
            console.log('Monte o lanche primeiro.');
          }
          break;
        case EtapaPedido.ADICIONAIS:
          if (opcao === '1') {
            await adicionarExtra();
          } else if (opcao === '2') {
            etapa = EtapaPedido.PAGAMENTO;
          } else if (opcao === '3') {
            reiniciarPedido();
            console.log('Pedido cancelado.');
          } else {
            console.log('Opção inválida.');
          }
          break;
        case EtapaPedido.PAGAMENTO:
          if (opcao === '1') {
            await escolherPagamento();
          } else if (opcao === '2') {
            etapa = EtapaPedido.ADICIONAIS;
          } else if (opcao === '3') {
            reiniciarPedido();
            console.log('Pedido cancelado.');
          } else {
            console.log('Opção inválida.');
          }
          break;
        case EtapaPedido.CONFIRMACAO:
          if (opcao === '1') {
            finalizar();
          } else if (opcao === '2') {
            pagamento = null;
            etapa = EtapaPedido.PAGAMENTO;
          } else if (opcao === '3') {
            reiniciarPedido();
            console.log('Pedido cancelado.');
          } else {
            console.log('Opção inválida.');
          }
          break;
      }
    }
  } finally {
    rl.close();
  }
}

// ==========================================
// INICIAR O SISTEMA
// ==========================================
main().catch((erro) => {
  console.error('Erro:', erro);
  process.exitCode = 1;
});
