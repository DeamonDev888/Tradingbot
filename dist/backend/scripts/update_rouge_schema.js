"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
});
async function updateRougePulseSchema() {
    const client = await pool.connect();
    try {
        console.log('🚀 Updating rouge_pulse_analyses schema...');
        // Ajouter les nouvelles colonnes si elles n'existent pas
        await client.query(`
      ALTER TABLE rouge_pulse_analyses 
      ADD COLUMN IF NOT EXISTS sp500_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS technical_levels JSONB,
      ADD COLUMN IF NOT EXISTS es_futures_analysis JSONB,
      ADD COLUMN IF NOT EXISTS bot_signal JSONB,
      ADD COLUMN IF NOT EXISTS agent_state JSONB,
      ADD COLUMN IF NOT EXISTS next_session_levels JSONB;
    `);
        console.log('✅ Schema updated successfully.');
    }
    catch (error) {
        console.error('❌ Error updating schema:', error);
    }
    finally {
        client.release();
        await pool.end();
    }
}
updateRougePulseSchema();
