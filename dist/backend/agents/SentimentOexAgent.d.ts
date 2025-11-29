import { BaseAgentSimple } from './BaseAgentSimple';
export declare class SentimentOexAgent extends BaseAgentSimple {
    private scraper;
    private pool;
    constructor();
    analyzeSentiment(): Promise<any>;
    private createAnalysisPrompt;
    private saveAnalysisToDatabase;
}
//# sourceMappingURL=SentimentOexAgent.d.ts.map