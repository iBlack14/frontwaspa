type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'websocket';

class Logger {
    info(message: string, ...args: any[]) {
        console.log(`ℹ️ [INFO] ${message}`, ...args);
    }

    warn(message: string, context?: string, ...args: any[]) {
        console.warn(`⚠️ [WARN] ${context ? `[${context}] ` : ''}${message}`, ...args);
    }

    error(message: string, context?: string, ...args: any[]) {
        console.error(`❌ [ERROR] ${context ? `[${context}] ` : ''}${message}`, ...args);
    }

    success(message: string, context?: string, ...args: any[]) {
        console.log(`✅ [SUCCESS] ${context ? `[${context}] ` : ''}${message}`, ...args);
    }

    websocket(message: string, ...args: any[]) {
        console.log(`🔌 [WS] ${message}`, ...args);
    }
}

export const logger = new Logger();
