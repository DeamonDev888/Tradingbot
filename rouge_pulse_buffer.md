
# RougePulse Analysis Buffer

## 📊 Economic Data
```json

You are RougePulse, an expert economic calendar analyst with a deep understanding of market narratives.

TASK:
Analyze the economic events and news context to provide a strategic market assessment.
Focus on the "WHY" - why does this data matter for Bitcoin (BTC) and S&P 500 (ES)?

ECONOMIC EVENTS:
[
  {
    "id": "d1e17f44-79f3-4ca1-ad99-672ed430d2a8",
    "event_date": "2025-11-24T15:30:00.000Z",
    "country": "United States",
    "event_name": "Dallas Fed Manufacturing Index",
    "importance": 0,
    "actual": "-10.4",
    "forecast": "-1",
    "previous": "-5.0",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.728Z"
  },
  {
    "id": "43a44acd-0e59-450e-a7d3-634d0603ad19",
    "event_date": "2025-11-24T16:30:00.000Z",
    "country": "United States",
    "event_name": "3-Month Bill Auction",
    "importance": 0,
    "actual": "3.745%",
    "forecast": "",
    "previous": "3.795%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.752Z"
  },
  {
    "id": "f4d48e9d-5d95-43f4-bfcd-2f8974201a7e",
    "event_date": "2025-11-24T16:30:00.000Z",
    "country": "United States",
    "event_name": "6-Month Bill Auction",
    "importance": 0,
    "actual": "3.670%",
    "forecast": "",
    "previous": "3.710%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.756Z"
  },
  {
    "id": "87531807-2929-4432-9a8b-0cc1fb713b7f",
    "event_date": "2025-11-24T18:00:00.000Z",
    "country": "United States",
    "event_name": "2-Year Note Auction",
    "importance": 0,
    "actual": "3.489%",
    "forecast": "",
    "previous": "3.504%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.758Z"
  },
  {
    "id": "ff83cfc9-c886-426d-ba16-40e55393bfee",
    "event_date": "2025-11-25T13:15:00.000Z",
    "country": "United States",
    "event_name": "ADP Employment Change Weekly",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-2.5K",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.761Z"
  },
  {
    "id": "3bac6e79-a2f5-404d-82dc-4cb2e9fe1bf3",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.5%",
    "previous": "-0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.763Z"
  },
  {
    "id": "97d0e623-0af7-4f16-87aa-6cfa44930eef",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.3%",
    "previous": "0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.765Z"
  },
  {
    "id": "8697e3aa-3e61-4ab5-9e2f-6b63f12f4b95",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Core PPI MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.2%",
    "previous": "-0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.767Z"
  },
  {
    "id": "eccdf347-2431-4aad-b057-535c3731858c",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales Control Group MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.4%",
    "previous": "0.7%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.769Z"
  },
  {
    "id": "314aba8d-f597-445b-a405-bbefc83a74a5",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales Ex Autos MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.4%",
    "previous": "0.7%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.771Z"
  },
  {
    "id": "7d7181d6-b43f-4799-aa65-c111572b627d",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Core PPI YoY",
    "importance": 0,
    "actual": "",
    "forecast": "2.8%",
    "previous": "2.8%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.773Z"
  },
  {
    "id": "78191068-5273-4423-8902-d220ea482b82",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI",
    "importance": 0,
    "actual": "",
    "forecast": "149.4",
    "previous": "149.160",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.775Z"
  },
  {
    "id": "5c9d0384-6dd4-41c1-b976-b2f6484fc58d",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI Ex Food, Energy and Trade MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.2%",
    "previous": "0.3%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.777Z"
  },
  {
    "id": "fc80bca6-55d0-4d34-ad9e-64e1ff168663",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI Ex Food, Energy and Trade YoY",
    "importance": 0,
    "actual": "",
    "forecast": "2.7%",
    "previous": "2.8%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.779Z"
  },
  {
    "id": "85a597f9-8721-4a78-81cc-4db9e1002ce3",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI YoY",
    "importance": 0,
    "actual": "",
    "forecast": "2.6%",
    "previous": "2.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.781Z"
  },
  {
    "id": "17a39023-21f8-4247-abcd-6cba8632fe76",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales Ex Gas/Autos MoM",
    "importance": 0,
    "actual": "",
    "forecast": "-0.5%",
    "previous": "0.7%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.783Z"
  },
  {
    "id": "41d5b5fd-879a-4b11-a87f-7ba833ebf8bb",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales YoY",
    "importance": 0,
    "actual": "",
    "forecast": "3.9%",
    "previous": "5%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.785Z"
  },
  {
    "id": "11fea91b-276b-4da5-b95d-b6e08939fe9f",
    "event_date": "2025-11-25T13:55:00.000Z",
    "country": "United States",
    "event_name": "Redbook YoY",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "6.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.787Z"
  },
  {
    "id": "5f4d9f76-b0bb-46c1-851d-8a12c1f8a530",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "S&P/Case-Shiller Home Price YoY",
    "importance": 0,
    "actual": "",
    "forecast": "1.6%",
    "previous": "1.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.788Z"
  },
  {
    "id": "4d5ad6b2-7441-4fb7-998d-1441243cc5cc",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "House Price Index",
    "importance": 0,
    "actual": "",
    "forecast": "436.6",
    "previous": "435.3",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.790Z"
  },
  {
    "id": "1e944be6-32d6-425b-a556-db636f839b69",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "House Price Index MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.3%",
    "previous": "0.4%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.793Z"
  },
  {
    "id": "75c46455-a10a-4613-9c90-7f84d3cd1ac1",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "House Price Index YoY",
    "importance": 0,
    "actual": "",
    "forecast": "1.5%",
    "previous": "2.3%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.795Z"
  },
  {
    "id": "44d56e11-0bf7-4e99-bc8f-e8ef7885a484",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "S&P/Case-Shiller Home Price MoM",
    "importance": 0,
    "actual": "",
    "forecast": "-0.4%",
    "previous": "-0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.797Z"
  },
  {
    "id": "df5ba88b-74b2-4279-9467-8b9a9d0bb954",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Business Inventories MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.1%",
    "previous": "0.2%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.799Z"
  },
  {
    "id": "ec1d13bb-68c8-42ff-ab37-80678e91d8e8",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Pending Home Sales MoM",
    "importance": 0,
    "actual": "",
    "forecast": "-0.4%",
    "previous": "0.0%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.803Z"
  },
  {
    "id": "ad27ce93-b574-421f-b225-97d3a65aea7c",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Pending Home Sales YoY",
    "importance": 0,
    "actual": "",
    "forecast": "-2.4%",
    "previous": "-0.9%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.805Z"
  },
  {
    "id": "e911462a-6123-4c11-aab0-26f36ae6c074",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Retail Inventories Ex Autos MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.3%",
    "previous": "0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.807Z"
  },
  {
    "id": "eb52d0a1-f246-4fc8-bf04-fbe93ef6219e",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Richmond Fed Manufacturing Index",
    "importance": 0,
    "actual": "",
    "forecast": "-1",
    "previous": "-4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.808Z"
  },
  {
    "id": "d6d6192e-cefc-4002-8831-efa72fea5a47",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Richmond Fed Manufacturing Shipments Index",
    "importance": 0,
    "actual": "",
    "forecast": "6",
    "previous": "4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.810Z"
  },
  {
    "id": "6368df00-5183-4824-8665-8d18e3744980",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Richmond Fed Services Revenues Index",
    "importance": 0,
    "actual": "",
    "forecast": "5",
    "previous": "4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.812Z"
  },
  {
    "id": "b095e336-b6cc-456a-83c3-3d10e9f73359",
    "event_date": "2025-11-25T15:30:00.000Z",
    "country": "United States",
    "event_name": "Dallas Fed Services Index",
    "importance": 0,
    "actual": "",
    "forecast": "-6",
    "previous": "-9.4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.813Z"
  },
  {
    "id": "79dc3c58-b09c-46f6-8aaf-0e72466927a2",
    "event_date": "2025-11-25T15:30:00.000Z",
    "country": "United States",
    "event_name": "Dallas Fed Services Revenues Index",
    "importance": 0,
    "actual": "",
    "forecast": "-3",
    "previous": "-6.4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.815Z"
  },
  {
    "id": "fe86d44f-cacf-4ab9-8fa8-ede408fb4c7e",
    "event_date": "2025-11-25T16:30:00.000Z",
    "country": "United States",
    "event_name": "52-Week Bill Auction",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "3.445%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.817Z"
  },
  {
    "id": "151c73b7-8841-416f-969a-5bf96824ed0f",
    "event_date": "2025-11-25T18:00:00.000Z",
    "country": "United States",
    "event_name": "5-Year Note Auction",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "3.625%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.819Z"
  },
  {
    "id": "1febb06e-b098-45a8-b2a1-2e5b91e41d8a",
    "event_date": "2025-11-25T18:00:00.000Z",
    "country": "United States",
    "event_name": "Money Supply",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "$22.21T",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.821Z"
  },
  {
    "id": "cf52cf83-1969-49e0-bffe-b0400d89323f",
    "event_date": "2025-11-25T21:30:00.000Z",
    "country": "United States",
    "event_name": "API Crude Oil Stock Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "4.4M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.823Z"
  }
]

MARKET NEWS CONTEXT (ZeroHedge/FinancialJuice):
- MarketWatch: What the Nasdaq's best day since May means for this holiday trading week
- MarketWatch: 5:44p
                                            
                                                Nasdaq has best day since May as Alphabet drives AI rebound. Here’s what it means for the rest of Thanksgiving week.
- MarketWatch: 5:09p
                                            
                                                Trump’s healthcare plan could extend Obamacare subsidies. Here’s what we know so far.
- MarketWatch: 4:57p
                                            
                                                There’s still hope GLP-1 drugs could slow the second-biggest type of dementia
- FinancialJuice: FinancialJuice: EU council formally adopts EU budget for 2026
- FinancialJuice: FinancialJuice: Trump: Full benefit of tariffs has not yet been calculated
- FinancialJuice: FinancialJuice: Trump: Is it really possible that big progress is being made in peace talks between Russia and Ukraine???
- FinancialJuice: FinancialJuice: French PM Lecornu: We need to stick to our deficit target.
- FinancialJuice: FinancialJuice: French PM Lecornu: I will hold further meetings with political groups in coming days over budget.
- FinancialJuice: FinancialJuice: French PM Lecornu: I still sees possible majority in lower house for budget.

INSTRUCTIONS:
1. **Score the Impact**: Instead of just High/Low, assign an "Impact Score" (0-100) for the session.
2. **Narrative Analysis**: Explain what the "Smart Money" or market pundits are saying. Does this data confirm a trend (e.g., "Soft Landing", "Reflation", "Recession")?
3. **Asset Specifics**: Explicitly state the likely impact on Bitcoin (BTC) and ES Futures.
4. **Cross-Reference**: If a news headline matches an event, use it to validate the sentiment.

REQUIRED JSON OUTPUT:
{
  "impact_score": number, // 0-100 (100 = Extreme Volatility/Importance)
  "market_narrative": "Detailed explanation of the current market story (e.g. 'Inflation is sticky, bad for tech').",
  "high_impact_events": [
    { 
      "event": "Name", 
      "actual_vs_forecast": "Description of deviation", 
      "significance": "Why this specific number matters now" 
    }
  ],
  "asset_analysis": {
    "ES_Futures": { "bias": "BULLISH|BEARISH", "reasoning": "..." },
    "Bitcoin": { "bias": "BULLISH|BEARISH", "reasoning": "..." }
  },
  "trading_recommendation": "Actionable advice based on the data + narrative."
}

```

## 🤖 Instructions
Analyze the data above and return ONLY the requested JSON.
