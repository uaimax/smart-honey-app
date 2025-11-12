import AsyncStorage from '@react-native-async-storage/async-storage';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

const LOGS_STORAGE_KEY = '@smart_honey:logs';
const LOG_LEVEL_KEY = '@smart_honey:log_level';
const MAX_LOGS = 1000; // Manter apenas os últimos 1000 logs

class LoggerService {
  private currentLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];

  constructor() {
    this.loadLogLevel();
    this.loadStoredLogs();
  }

  /**
   * Define o nível mínimo de log
   */
  setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
    AsyncStorage.setItem(LOG_LEVEL_KEY, level.toString());
  }

  /**
   * Carrega o nível de log salvo
   */
  private async loadLogLevel(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(LOG_LEVEL_KEY);
      if (saved) {
        this.currentLevel = parseInt(saved) as LogLevel;
      }
    } catch (error) {
      console.warn('Erro ao carregar nível de log:', error);
    }
  }

  /**
   * Carrega logs salvos
   */
  private async loadStoredLogs(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Erro ao carregar logs salvos:', error);
    }
  }

  /**
   * Salva logs no AsyncStorage
   */
  private async saveLogs(): Promise<void> {
    try {
      // Criar uma cópia dos logs sem referências circulares
      const safeLogsToSave = this.logs.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        category: log.category,
        message: log.message,
        data: this.sanitizeData(log.data),
      }));

      await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(safeLogsToSave));
    } catch (error) {
      console.warn('Erro ao salvar logs:', error);
    }
  }

  /**
   * Sanitiza dados para evitar referências circulares
   */
  private sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    try {
      // Tentar serializar/deserializar para verificar se é seguro
      JSON.stringify(data);
      return data;
    } catch (error) {
      // Se falhar, retornar uma representação segura
      if (typeof data === 'object') {
        try {
          // Tentar extrair algumas propriedades básicas
          const safe: any = {};
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              const value = data[key];
              if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                safe[key] = value;
              } else if (value === null || value === undefined) {
                safe[key] = value;
              } else {
                safe[key] = '[Complex Object]';
              }
            }
          }
          return safe;
        } catch {
          return '[Unserializable Object]';
        }
      }
      return String(data);
    }
  }

  /**
   * Adiciona uma entrada de log
   */
  private addLog(level: LogLevel, category: string, message: string, data?: any): void {
    if (level < this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    // Adicionar ao array
    this.logs.unshift(entry);

    // Manter apenas os últimos MAX_LOGS
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    // Salvar no AsyncStorage (não aguardar para não bloquear)
    this.saveLogs();

    // Logar no console também
    const emoji = this.getLevelEmoji(level);
    const prefix = `${emoji} [${category}]`;

    // Serializar data de forma segura para evitar erros de referência circular
    let dataStr = '';
    if (data !== undefined) {
      try {
        dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
      } catch (error) {
        dataStr = '[Circular Reference or Unserializable Object]';
      }
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.log(prefix, message, dataStr);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, dataStr);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, dataStr);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, dataStr);
        break;
    }
  }

  /**
   * Emoji para cada nível de log
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }

  /**
   * Log de debug
   */
  debug(category: string, message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log de informação
   */
  info(category: string, message: string, data?: any): void {
    this.addLog(LogLevel.INFO, category, message, data);
  }

  /**
   * Log de aviso
   */
  warn(category: string, message: string, data?: any): void {
    this.addLog(LogLevel.WARN, category, message, data);
  }

  /**
   * Log de erro
   */
  error(category: string, message: string, data?: any): void {
    this.addLog(LogLevel.ERROR, category, message, data);
  }

  /**
   * Retorna todos os logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Retorna logs filtrados por categoria
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Retorna logs filtrados por nível
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level >= level);
  }

  /**
   * Limpa todos os logs
   */
  async clearLogs(): Promise<void> {
    this.logs = [];
    await AsyncStorage.removeItem(LOGS_STORAGE_KEY);
  }

  /**
   * Exporta logs como texto
   */
  exportLogs(): string {
    return this.logs
      .map(log => {
        const level = LogLevel[log.level];
        const data = log.data ? ` | ${JSON.stringify(log.data)}` : '';
        return `${log.timestamp} [${level}] [${log.category}] ${log.message}${data}`;
      })
      .join('\n');
  }

  /**
   * Estatísticas dos logs
   */
  getStats(): { total: number; byLevel: Record<string, number>; byCategory: Record<string, number> } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.logs.forEach(log => {
      const level = LogLevel[log.level];
      byLevel[level] = (byLevel[level] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
    };
  }
}

// Categorias de log padronizadas
export const LogCategory = {
  APP: 'App',
  AUTH: 'Auth',
  API: 'API',
  LOCATION: 'Location',
  NOTIFICATIONS: 'Notifications',
  WALLET: 'Wallet',
  QUEUE: 'Queue',
  DRAFTS: 'Drafts',
  SETTINGS: 'Settings',
  PERMISSIONS: 'Permissions',
} as const;

// Instância singleton
const logger = new LoggerService();

// Exportar instância e funções de conveniência
export default logger;
export const debug = (category: string, message: string, data?: any) => logger.debug(category, message, data);
export const info = (category: string, message: string, data?: any) => logger.info(category, message, data);
export const warn = (category: string, message: string, data?: any) => logger.warn(category, message, data);
export const error = (category: string, message: string, data?: any) => logger.error(category, message, data);