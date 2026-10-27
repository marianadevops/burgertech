export interface Item {

  getDescricao(): string;

  getPreco(): number;
}

export abstract class ItemDecorator implements Item {
  constructor(protected readonly item: Item) {}

  getDescricao(): string {
    return this.item.getDescricao();
  }

  getPreco(): number {
    return this.item.getPreco();
  }
}

export class BaconDecorator extends ItemDecorator {
  getDescricao(): string {
    return `${super.getDescricao()} + bacon`;
  }

  getPreco(): number {
    return super.getPreco() + 6;
  }
}

export class CheddarDecorator extends ItemDecorator {
  getDescricao(): string {
    return `${super.getDescricao()} + cheddar`;
  }

  getPreco(): number {
    return super.getPreco() + 4;
  }
}

export class OvoDecorator extends ItemDecorator {
  getDescricao(): string {
    return `${super.getDescricao()} + ovo`;
  }

  getPreco(): number {
    return super.getPreco() + 3;
  }
}
