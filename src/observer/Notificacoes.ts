export interface Observador {

  atualizar(mensagem: string): void;
}

export class CentralPedidos {
  private observadores: Observador[] = [];

  inscrever(observador: Observador): void {
    if (!this.observadores.includes(observador)) {
      this.observadores.push(observador);
    }
  }

  desinscrever(observador: Observador): void {
    this.observadores = this.observadores.filter(o => o !== observador);
  }

  notificar(mensagem: string): void {
    for (const observador of this.observadores) {
      observador.atualizar(mensagem);
    }
  }
}

export class Cozinha implements Observador {
  atualizar(mensagem: string): void {
    console.log(`[COZINHA] ${mensagem}`);
  }
}

export class PainelPedidos implements Observador {
  atualizar(mensagem: string): void {
    console.log(`[PAINEL] ${mensagem}`);
  }
}
