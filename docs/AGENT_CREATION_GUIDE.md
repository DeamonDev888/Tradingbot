# 📘 Guide de Création d'Agent IA (Architecture Financial Analyst)

Ce guide détaille étape par étape comment créer un nouvel agent (ex: `RiskAgent`, `CryptoAgent`, `TwitterScraperAgent`) en utilisant l'architecture existante basée sur **Playwright**, **PostgreSQL**, et **KiloCode AI**.

---

## 📑 Sommaire

1. [Architecture Globale](#1-architecture-globale)
2. [Étape 1 : Le Scraper (Playwright)](#2-étape-1--le-scraper-playwright)
3. [Étape 2 : La Base de Données](#3-étape-2--la-base-de-données)
4. [Étape 3 : L'Agent (Logique & Prompt)](#4-étape-3--lagent-logique--prompt)
5. [Étape 4 : Intégration dans `run.ts`](#5-étape-4--intégration-dans-runts)
6. [Annexe : Commandes KiloCode & Buffer](#annexe--commandes-kilocode--buffer)

---

## 1. Architecture Globale

Un agent complet se compose de 3 fichiers principaux :

1.  **`Scraper.ts`** : Récupère les données brutes du web.
2.  **`Agent.ts`** : Orchestre le scraping, prépare le prompt, et appelle l'IA.
3.  **`run.ts`** : Point d'entrée pour exécuter l'agent via CLI.

---

## 2. Étape 1 : Le Scraper (Playwright)

Créez un fichier dans `src/backend/ingestion/` (ex: `RiskPlaywrightScraper.ts`).

### Structure Type

```typescript
import { chromium, Browser, Page } from "playwright";
import { Pool } from "pg";

export interface ScrapeResult {
  source: string;
  data: any; // Définir votre interface de données
  error?: string;
}

export class RiskPlaywrightScraper {
  private browser: Browser | null = null;

  // 1. Initialisation du navigateur (Mode Stealth)
  async init() {
    this.browser = await chromium.launch({ headless: true });
  }

  // 2. Création d'une page "furtive"
  private async createStealthPage(): Promise<Page> {
    const context = await this.browser!.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    });
    const page = await context.newPage();
    // Ajouter les scripts anti-détection ici (voir VixPlaywrightScraper.ts)
    return page;
  }

  // 3. Méthode principale de scraping
  async scrapeAll(): Promise<ScrapeResult[]> {
    await this.init();
    const results = [];

    // Exemple de scraping
    try {
      const page = await this.createStealthPage();
      await page.goto("https://example.com/risk-data");

      // Extraction
      const value = await page.textContent(".risk-metric");
      results.push({ source: "Example", data: value });
    } catch (e) {
      console.error(e);
    } finally {
      await this.browser?.close();
    }
    return results;
  }

  // 4. Sauvegarde en Base de Données
  async saveToDatabase(pool: Pool, results: ScrapeResult[]) {
    const client = await pool.connect();
    try {
      // INSERT INTO...
    } finally {
      client.release();
    }
  }
}
```

---

## 3. Étape 2 : La Base de Données

Si vous avez besoin de stocker de nouvelles données, ajoutez les tables dans votre schéma ou exécutez une migration.

### Exemple SQL

```sql
CREATE TABLE IF NOT EXISTS risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50),
    metric_name VARCHAR(100),
    value NUMERIC,
    scraped_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Étape 3 : L'Agent (Logique & Prompt)

Créez un fichier dans `src/backend/agents/` (ex: `RiskAgent.ts`). Il hérite de `BaseAgentSimple`.

### Code Complet de l'Agent

```typescript
import { BaseAgentSimple } from "./BaseAgentSimple";
import { RiskPlaywrightScraper } from "../ingestion/RiskPlaywrightScraper";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

export class RiskAgent extends BaseAgentSimple {
  private scraper: RiskPlaywrightScraper;
  private execAsync: any;

  constructor() {
    super("risk-agent"); // Nom de l'agent
    this.scraper = new RiskPlaywrightScraper();
    this.execAsync = promisify(exec);
  }

  async analyzeRisk(): Promise<any> {
    // 1. Scraper les données
    const data = await this.scraper.scrapeAll();

    // 2. Créer le Prompt
    const prompt = this.createPrompt(data);

    // 3. Envoyer à KiloCode via Buffer
    return await this.tryKiloCodeWithFile(prompt);
  }

  private createPrompt(data: any): string {
    return `
You are RiskAgent, an expert in financial risk.

TASK:
Analyze the following raw data and output JSON.

RAW DATA:
${JSON.stringify(data, null, 2)}

REQUIRED JSON STRUCTURE:
{
  "risk_score": number,
  "alert_level": "string",
  "recommendation": "string"
}

RULES:
1. Return ONLY valid JSON.
`;
  }

  // 4. Méthode "Magique" : Buffer + KiloCode CLI
  private async tryKiloCodeWithFile(prompt: string): Promise<any> {
    const bufferPath = path.resolve("risk_buffer.md");

    // Création du fichier Buffer (Markdown)
    const content = `
# Risk Analysis Buffer
## 📊 Data
\`\`\`json
${prompt}
\`\`\`
## 🤖 Instructions
Analyze the data above and return ONLY the requested JSON.
`;
    await fs.writeFile(bufferPath, content, "utf-8");

    // Commande CLI KiloCode
    // Windows: type "file" | kilocode ...
    const command = `type "${bufferPath}" | kilocode -m ask --auto --json`;

    try {
      const { stdout } = await this.execAsync(command, { timeout: 90000 });
      return this.parseOutput(stdout); // Parser le JSON de la réponse
    } catch (error) {
      console.error("KiloCode failed:", error);
      return null;
    }
  }

  // ... (Ajouter la méthode parseOutput comme dans VixombreAgent)
}
```

---

## 5. Étape 4 : Intégration dans `run.ts`

Pour rendre l'agent utilisable via la ligne de commande (`pnpm ...`).

1.  **Importer** la classe dans `run.ts`.
2.  Ajouter une propriété dans `FinancialAnalystApp`.
3.  Ajouter une méthode d'exécution.
4.  Ajouter un cas dans le `switch` du `main()`.

```typescript
// Dans run.ts

// 1. Import
import { RiskAgent } from './src/backend/agents/RiskAgent';

class FinancialAnalystApp {
    private riskAgent: RiskAgent; // 2. Propriété

    constructor() {
        this.riskAgent = new RiskAgent();
    }

    // 3. Méthode
    async runRiskAnalysis() {
        console.log("Starting Risk Analysis...");
        const result = await this.riskAgent.analyzeRisk();
        console.log(result);
    }
}

// 4. Switch Case
// ...
case '--risk':
    await app.runRiskAnalysis();
    break;
// ...
```

---

## Annexe : Commandes KiloCode & Buffer

### Le concept du Buffer

L'IA ne peut pas toujours traiter de gros JSON directement via l'argument de ligne de commande (limite de caractères du terminal).
**Solution** : On écrit les données dans un fichier `.md` temporaire (`buffer`), puis on "pipe" ce fichier dans l'entrée standard de KiloCode.

### La Commande CLI Exacte

```bash
type "votre_buffer.md" | kilocode -m ask --auto --json
```

- `type` (Windows) / `cat` (Linux/Mac) : Lit le fichier.
- `|` : Envoie le contenu vers la commande suivante.
- `kilocode` : L'exécutable de l'IA.
- `-m ask` : Mode "Question/Réponse".
- `--auto` : Mode automatique (pas d'interaction utilisateur).
- `--json` : Force (ou incite fortement) une sortie JSON.

### Parsing de la Réponse

La sortie de KiloCode peut contenir du texte de "pensée" (`<thinking>`) ou des logs. Il est crucial d'utiliser une regex pour extraire uniquement le bloc JSON :

````typescript
const jsonMatch =
  stdout.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
  stdout.match(/\{[\s\S]*?\}/);
````
