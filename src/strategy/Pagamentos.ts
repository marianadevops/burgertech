export interface EstrategiaPagamento {
  readonly nome: string;

  calcularTotal(valor: number): number;
}

export class PagamentoPix implements EstrategiaPagamento {
  readonly nome = 'PIX (5% de desconto)';

  calcularTotal(valor: number): number {
    return Math.round(valor * 0.95 * 100) / 100;
  }
}

export class PagamentoCartao implements EstrategiaPagamento {
  readonly nome = 'Cartão (sem acréscimo)';

  calcularTotal(valor: number): number {
    return valor;
  }
}

export class PagamentoDinheiro implements EstrategiaPagamento {
  readonly nome = 'Dinheiro (sem acréscimo)';

  calcularTotal(valor: number): number {
    return valor;
  }
}

export class Caixa {
  constructor(private estrategia: EstrategiaPagamento) {}

  definirEstrategia(estrategia: EstrategiaPagamento): void {
    this.estrategia = estrategia;
  }

  fecharConta(valor: number): { forma: string; total: number } {
    return { forma: this.estrategia.nome, total: this.estrategia.calcularTotal(valor) };
  }
}
