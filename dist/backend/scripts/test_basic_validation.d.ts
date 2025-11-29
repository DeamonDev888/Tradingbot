#!/usr/bin/env ts-node
declare class SimpleValidationTest {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    basicAnalysis(): Promise<number>;
    checkTables(): Promise<void>;
    checkIndexes(): Promise<void>;
    close(): Promise<void>;
}
export { SimpleValidationTest };
//# sourceMappingURL=test_basic_validation.d.ts.map