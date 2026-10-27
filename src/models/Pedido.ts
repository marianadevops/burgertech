import { Item } from '../decorator/Adicionais';

export enum StatusPedido {
  CRIADO = 'CRIADO',
  CONFIRMADO = 'CONFIRMADO'
}

export interface Pedido {
  readonly id: number;
  readonly item: Item;
  readonly total: number;
  status: StatusPedido;
}

export type ResumoPedido = Pick<Pedido, 'id' | 'total' | 'status'>;

export class Historico<T extends { id: number }> {
  private registros: T[] = [];

  adicionar(registro: T): void {
    this.registros.push(registro);
  }

  listar(): readonly T[] {
    return [...this.registros];
  }
}
