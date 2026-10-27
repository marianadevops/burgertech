import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

interface Passo {
  tela: string;
  resposta: string;
}
// Envia cada resposta somente quando o terminal apresenta a próxima pergunta.
// O limite encerra o processo caso uma regressão deixe o menu bloqueado.

async function executarMenu(passos: Passo[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const processo = spawn(process.execPath, [join(__dirname, 'index.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let saida = '';
    let tela = '';
    let erros = '';
    let indice = 0;
    let falha: Error | undefined;
    const limite = setTimeout(() => {
      falha = new Error(`Menu excedeu o tempo no passo ${indice + 1}.`);
      processo.kill();
    }, 15000);
    processo.stdout.setEncoding('utf8');
    processo.stderr.setEncoding('utf8');
    processo.stderr.on('data', (dados: string) => { erros += dados; });
    processo.stdin.on('error', (erro) => { falha ??= erro; });
    processo.stdout.on('data', (dados: string) => {
      saida += dados;
      tela += dados;
      if (!/(?:Opção: |\(s\/n\): )$/.test(tela)) {
        return;
      }
      try {
        const passo = passos[indice++];
        assert.ok(passo, 'O menu solicitou uma resposta inesperada.');
        assert.ok(tela.includes(passo.tela), `Esperado: ${passo.tela}\nRecebido: ${tela}`);
        tela = '';
        processo.stdin.write(`${passo.resposta}\n`);
      } catch (erro) {
        falha = erro as Error;
        processo.kill();
      }
    });
    processo.on('error', (erro) => {
      clearTimeout(limite);
      reject(erro);
    });
    processo.on('close', (codigo) => {
      clearTimeout(limite);
      try {
        if (falha) {
          throw falha;
        }
        assert.equal(codigo, 0, erros);
        assert.equal(erros, '');
        assert.equal(indice, passos.length);
        assert.ok(saida.includes('Até logo!'));
        resolve(saida);
      } catch (erro) {
        reject(erro);
      }
    });
  });
}

export async function testarMenu(): Promise<void> {
  const saida = await executarMenu([
    { tela: 'MONTAGEM', resposta: '2' },
    { tela: 'Monte o lanche primeiro.', resposta: '8' },
    { tela: 'Nenhum pedido confirmado.', resposta: '1' },
    { tela: 'TIPO DE PÃO', resposta: '99' },
    { tela: 'Opção inválida.', resposta: '1' },
    { tela: 'TIPO DE CARNE', resposta: '1' },
    { tela: 'Adicionar queijo?', resposta: 'x' },
    { tela: 'Digite s para sim ou n para não.', resposta: 's' },
    { tela: 'Adicionar salada?', resposta: 'n' },
    { tela: 'Adicionar molho?', resposta: 'n' },
    { tela: 'Subtotal: R$ 23,00', resposta: '1' },
    { tela: 'Bacon (+ R$ 6,00)', resposta: '1' },
    { tela: 'Subtotal: R$ 29,00', resposta: '1' },
    { tela: 'Cheddar (+ R$ 4,00)', resposta: '2' },
    { tela: 'Subtotal: R$ 33,00', resposta: '2' },
    { tela: 'PAGAMENTO', resposta: '7' },
    { tela: 'Opção inválida.', resposta: '9' },
    { tela: 'Lanche montado com sucesso', resposta: '1' },
    { tela: 'FORMAS DE PAGAMENTO', resposta: '1' },
    { tela: 'Total a pagar: R$ 31,35', resposta: '1' },
    { tela: '[PAINEL] Pedido #1 confirmado.', resposta: '8' },
    { tela: 'Status: CONFIRMADO', resposta: '0' }
  ]);
  assert.equal((saida.match(/\[COZINHA\] Pedido #1 confirmado\./g) ?? []).length, 1);
  assert.ok(saida.includes('Total: R$ 31,35'));
  const cancelamento = await executarMenu([
    { tela: 'MONTAGEM', resposta: '1' },
    { tela: 'TIPO DE PÃO', resposta: '0' },
    { tela: 'Montagem cancelada.', resposta: '1' },
    { tela: 'TIPO DE PÃO', resposta: '2' },
    { tela: 'TIPO DE CARNE', resposta: '3' },
    { tela: 'Adicionar queijo?', resposta: 'n' },
    { tela: 'Adicionar salada?', resposta: 'n' },
    { tela: 'Adicionar molho?', resposta: 'n' },
    { tela: 'ADICIONAIS', resposta: '2' },
    { tela: 'PAGAMENTO', resposta: '1' },
    { tela: 'FORMAS DE PAGAMENTO', resposta: '0' },
    { tela: 'ADICIONAIS', resposta: '2' },
    { tela: 'PAGAMENTO', resposta: '1' },
    { tela: 'FORMAS DE PAGAMENTO', resposta: '2' },
    { tela: 'Total a pagar: R$ 20,00', resposta: '2' },
    { tela: 'PAGAMENTO', resposta: '1' },
    { tela: 'FORMAS DE PAGAMENTO', resposta: '3' },
    { tela: 'Dinheiro (sem acréscimo)', resposta: '3' },
    { tela: 'Pedido cancelado.', resposta: '8' },
    { tela: 'Nenhum pedido confirmado.', resposta: '0' }
  ]);
  assert.ok(!cancelamento.includes('[COZINHA]'));
  console.log('Testes do menu passaram: etapas, validação, pagamento, confirmação, cancelamento e histórico.');
}
