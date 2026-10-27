export type NivelLog = 'INFO' | 'WARN' | 'ERROR';

export interface RegistroLog {
  readonly data: string;
  readonly nivel: NivelLog;
  readonly mensagem: string;
}

export class LoggerService {
  private static instancia: LoggerService | null = null;
  private readonly registros: RegistroLog[] = [];
  private readonly limite = 5;

  private constructor() {}

  static getInstance(): LoggerService {
    if (!LoggerService.instancia) {
      LoggerService.instancia = new LoggerService();
    }
    return LoggerService.instancia;
  }

  log(nivel: NivelLog, mensagem: string): void {
    this.registros.push({ data: new Date().toISOString(), nivel, mensagem });
    if (this.registros.length > this.limite) {
      this.registros.shift();
    }
  }

  imprimirHistorico(): void {
    if (!this.registros.length) {
      console.log('Nenhum log registrado.');
    }
    for (const registro of this.registros) {
      console.log(`[${registro.data}] [${registro.nivel}] ${registro.mensagem}`);
    }
  }

  limparLogs(): void {
    this.registros.length = 0;
  }

  listar(): readonly RegistroLog[] {
    return [...this.registros];
  }
}
