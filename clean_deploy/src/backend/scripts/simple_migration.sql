ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS sp500_price DECIMAL(10, 2);

ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS technical_levels JSONB;

CREATE INDEX IF NOT EXISTS idx_rouge_pulse_technical_levels
ON rouge_pulse_analyses USING GIN (technical_levels);

CREATE INDEX IF NOT EXISTS idx_rouge_pulse_sp500_price
ON rouge_pulse_analyses (sp500_price);

ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS bot_action VARCHAR(20);

ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS bot_confidence INTEGER CHECK (bot_confidence >= 0 AND bot_confidence <= 100);

ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS market_regime VARCHAR(30);

ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= -100 AND sentiment_score <= 100);

ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS agent_message TEXT;