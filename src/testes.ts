import assert from 'node:assert/strict';
import { LancheBuilder } from './builder/LancheBuilder';
import { BaconDecorator, CheddarDecorator, OvoDecorator } from './decorator/Adicionais';
import { Caixa, PagamentoCartao, PagamentoDinheiro, PagamentoPix } from './strategy/Pagamentos';
import { testarMenu } from './testesMenu';
import { CentralPedidos, Observador } from './observer/Notificacoes';
import { LoggerService } from './singleton/LoggerService';
import { Historico, Pedido, StatusPedido } from './models/Pedido';

// Builder e Decorator.
const lanche = new LancheBuilder('brioche', 'bovina').comQueijo().build();
assert.equal(lanche.getPreco(), 23);
const decorado = new CheddarDecorator(new BaconDecorator(lanche));
assert.equal(decorado.getPreco(), 33);

// Strategy: troca de pagamento em tempo de execução.
const caixa = new Caixa(new PagamentoCartao());
assert.equal(caixa.fecharConta(100).total, 100);
caixa.definirEstrategia(new PagamentoPix());
assert.equal(caixa.fecharConta(100).total, 95);

// Observer: inscrição, notificação e remoção.
let avisos = 0;
const observador: Observador = { atualizar: () => { avisos++; } };
const central = new CentralPedidos();
central.inscrever(observador);
central.notificar('teste');
central.desinscrever(observador);
central.notificar('teste');
assert.equal(avisos, 1);

// Singleton: instância compartilhada e limite FIFO.
const logger = LoggerService.getInstance();
assert.equal(logger, LoggerService.getInstance());
logger.limparLogs();
for (let i = 0; i < 6; i++) {
  logger.log('INFO', `evento ${i}`);
}
assert.equal(logger.listar().length, 5);
assert.equal(logger.listar()[0].mensagem, 'evento 1');

// Histórico genérico de pedidos confirmados.
const historico = new Historico<Pedido>();
historico.adicionar({ id: 1, item: lanche, total: 23, status: StatusPedido.CONFIRMADO });
assert.equal(historico.listar().length, 1);

// Cada build produz um lanche independente das próximas alterações do builder.
const builder = new LancheBuilder('Tradicional', 'Frango');
const simples = builder.build();
const completo = builder.comQueijo().comSalada().comMolho().build();
assert.equal(simples.getPreco(), 20);
assert.equal(completo.getPreco(), 26);
assert.equal(completo.getDescricao(), 'Hambúrguer (Tradicional, Frango) + queijo + salada + molho');
assert.equal(new OvoDecorator(decorado).getPreco(), 36);
assert.ok(new OvoDecorator(decorado).getDescricao().endsWith(' + bacon + cheddar + ovo'));
assert.equal(new PagamentoDinheiro().calcularTotal(33), 33);
assert.equal(new PagamentoPix().calcularTotal(33), 31.35);
assert.equal(new PagamentoPix().calcularTotal(20.10), 19.10);

let mensagemRecebida = '';
const inscrito: Observador = {
  atualizar: (mensagem) => {
    mensagemRecebida = mensagem;
    avisos++;
  }
};
central.inscrever(inscrito);
central.inscrever(inscrito);
central.notificar('Pedido confirmado');
assert.equal(avisos, 2, 'A mesma inscrição não deve duplicar notificações.');
assert.equal(mensagemRecebida, 'Pedido confirmado');
central.desinscrever(inscrito);
central.notificar('Sem observadores');
assert.equal(avisos, 2);

const copiaLogs = logger.listar();
logger.limparLogs();
assert.equal(logger.listar().length, 0);
assert.equal(copiaLogs.length, 5);
const copiaPedidos = historico.listar();
historico.adicionar({ id: 2, item: completo, total: 26, status: StatusPedido.CONFIRMADO });
assert.equal(copiaPedidos.length, 1);
assert.deepEqual(historico.listar().map((pedido) => pedido.id), [1, 2]);

console.log('Testes dos módulos passaram: Builder, Decorator, Strategy, Observer, Singleton e histórico.');
testarMenu().catch((erro: unknown) => {
  console.error(erro);
  process.exitCode = 1;
});
