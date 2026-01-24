/**
 * Logger profesional para Frontend (Next.js)
 * Logs limpios y coloridos en la consola del navegador
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
    level: LogLevel;
    emoji?: string;
    color?: string;
    module?: string;
}

class Logger {
    private isDev = process.env.NODE_ENV === 'development';

    private formatTime(): string {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    private log(message: string, options: LogOptions, ...args: any[]) {
        const { level, emoji = '', color = '#6366f1', module } = options;

        // En producción, solo mostrar warn y error
        if (!this.isDev && (level === 'debug' || level === 'info')) {
            return;
        }

        const time = this.formatTime();
        const prefix = module ? `[${module.toUpperCase()}]` : '';
        const levelEmoji = emoji || this.getLevelEmoji(level);

        const style = `
      color: ${color};
      font-weight: bold;
      padding: 2px 4px;
      border-radius: 3px;
    `;

        console[level === 'debug' ? 'log' : level](
            `%c${time} ${levelEmoji} ${prefix}`,
            style,
            message,
            ...args
        );
    }

    private getLevelEmoji(level: LogLevel): string {
        const emojis = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
        };
        return emojis[level];
    }

    // Métodos públicos
    debug(message: string, module?: string, ...args: any[]) {
        this.log(message, { level: 'debug', color: '#94a3b8', module }, ...args);
    }

    info(message: string, module?: string, ...args: any[]) {
        this.log(message, { level: 'info', color: '#3b82f6', module }, ...args);
    }

    success(message: string, module?: string, ...args: any[]) {
        this.log(message, { level: 'info', emoji: '✅', color: '#10b981', module }, ...args);
    }

    warn(message: string, module?: string, ...args: any[]) {
        this.log(message, { level: 'warn', color: '#f59e0b', module }, ...args);
    }

    error(message: string, module?: string, ...args: any[]) {
        this.log(message, { level: 'error', color: '#ef4444', module }, ...args);
    }

    // Helpers para módulos específicos
    api(message: string, ...args: any[]) {
        this.info(message, 'api', ...args);
    }

    websocket(message: string, ...args: any[]) {
        this.info(message, 'websocket', ...args);
    }

    ui(message: string, ...args: any[]) {
        this.debug(message, 'ui', ...args);
    }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar también como default
export default logger;
