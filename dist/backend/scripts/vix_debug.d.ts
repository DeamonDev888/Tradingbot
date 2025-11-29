import { EventEmitter } from 'events';
export declare class SierraChartDebug extends EventEmitter {
    private ws;
    private messageCount;
    constructor();
    connect(): Promise<void>;
    private sendMessage;
    private handleMessage;
    private requestAllSymbols;
    disconnect(): void;
}
//# sourceMappingURL=vix_debug.d.ts.map