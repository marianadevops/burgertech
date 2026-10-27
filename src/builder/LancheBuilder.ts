import { Item } from '../decorator/Adicionais';

export class Lanche implements Item {
  constructor(
    public readonly pao: string,
    public readonly carne: string,
    public readonly queijo: boolean,
    public readonly salada: boolean,
    public readonly molho: boolean
  ) {}

  getDescricao(): string {
    const partes = [`Hambúrguer (${this.pao}, ${this.carne})`];
    if (this.queijo) {
      partes.push('queijo');
    }
    if (this.salada) {
      partes.push('salada');
    }
    if (this.molho) {
      partes.push('molho');
    }
    return partes.join(' + ');
  }

  getPreco(): number {
    return 20 + (this.queijo ? 3 : 0) + (this.salada ? 2 : 0) + (this.molho ? 1 : 0);
  }
}

export class LancheBuilder {
  private queijo = false;
  private salada = false;
  private molho = false;

  constructor(private readonly pao: string, private readonly carne: string) {}

  comQueijo(): this {
    this.queijo = true;
    return this;
  }

  comSalada(): this {
    this.salada = true;
    return this;
  }

  comMolho(): this {
    this.molho = true;
    return this;
  }

  build(): Lanche {
    return new Lanche(this.pao, this.carne, this.queijo, this.salada, this.molho);
  }
}
