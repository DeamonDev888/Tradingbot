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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var FinnhubClient_1 = require("./src/backend/ingestion/FinnhubClient");
var dotenv = __importStar(require("dotenv"));
dotenv.config();
function testSP500Futures() {
    return __awaiter(this, void 0, void 0, function () {
        var client, esData, sp500Data, indices, _i, indices_1, index, error_1;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log('🧪 TEST: Récupération des données S&P500 Futures');
                    console.log('='.repeat(60));
                    client = new FinnhubClient_1.FinnhubClient();
                    if (!process.env.FINNHUB_API_KEY) {
                        console.error('❌ FINNHUB_API_KEY manquant dans .env');
                        process.exit(1);
                    }
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 5, , 6]);
                    // Test 1: Récupération directe des ES Futures
                    console.log('\n1️⃣ Test direct des ES Futures...');
                    return [4 /*yield*/, client.fetchESFutures()];
                case 2:
                    esData = _j.sent();
                    if (esData) {
                        console.log('✅ ES Futures récupérés avec succès:');
                        console.log("   Prix: ".concat(esData.current.toFixed(2)));
                        console.log("   Variation: ".concat(esData.change > 0 ? '+' : '').concat(esData.change, " (").concat(esData.percent_change > 0 ? '+' : '').concat(esData.percent_change.toFixed(2), "%)"));
                        console.log("   \u00C9cart: ".concat((_a = esData.low) === null || _a === void 0 ? void 0 : _a.toFixed(2), " - ").concat((_b = esData.high) === null || _b === void 0 ? void 0 : _b.toFixed(2)));
                        console.log("   Ouverture: ".concat((_c = esData.open) === null || _c === void 0 ? void 0 : _c.toFixed(2)));
                        console.log("   Cl\u00F4ture pr\u00E9c\u00E9dente: ".concat((_d = esData.previous_close) === null || _d === void 0 ? void 0 : _d.toFixed(2)));
                    }
                    else {
                        console.log('❌ ES Futures non disponibles');
                    }
                    // Test 2: Récupération S&P500 avec la nouvelle logique
                    console.log('\n2️⃣ Test S&P500 (nouvelle méthode avec priorité Futures)...');
                    return [4 /*yield*/, client.fetchSP500Data()];
                case 3:
                    sp500Data = _j.sent();
                    if (sp500Data) {
                        console.log('✅ S&P500 data récupéré avec succès:');
                        console.log("   Symbole: ".concat(sp500Data.symbol));
                        console.log("   Prix: ".concat(sp500Data.current.toFixed(2)));
                        console.log("   Variation: ".concat(sp500Data.change > 0 ? '+' : '').concat(sp500Data.change, " (").concat(sp500Data.percent_change > 0 ? '+' : '').concat(sp500Data.percent_change.toFixed(2), "%)"));
                        console.log("   \u00C9cart: ".concat((_e = sp500Data.low) === null || _e === void 0 ? void 0 : _e.toFixed(2), " - ").concat((_f = sp500Data.high) === null || _f === void 0 ? void 0 : _f.toFixed(2)));
                        console.log("   Ouverture: ".concat((_g = sp500Data.open) === null || _g === void 0 ? void 0 : _g.toFixed(2)));
                        console.log("   Cl\u00F4ture pr\u00E9c\u00E9dente: ".concat((_h = sp500Data.previous_close) === null || _h === void 0 ? void 0 : _h.toFixed(2)));
                        // Analyse de la source
                        if (sp500Data.symbol.includes('ES_FUTURES')) {
                            console.log('   📊 Source: Futures directs (recommandé)');
                        }
                        else if (sp500Data.symbol.includes('ES_FROM_SPY')) {
                            console.log('   📊 Source: SPY ETF converti (fallback)');
                        }
                        else if (sp500Data.symbol.includes('ES_FROM_QQQ')) {
                            console.log('   📊 Source: QQQ ETF converti (dernier fallback)');
                        }
                        else {
                            console.log('   📊 Source: ETF brut');
                        }
                    }
                    else {
                        console.log('❌ S&P500 data non disponible');
                    }
                    // Test 3: Comparaison avec les indices ETF
                    console.log('\n3️⃣ Test comparatif avec les ETFs...');
                    return [4 /*yield*/, client.fetchMajorIndices()];
                case 4:
                    indices = _j.sent();
                    for (_i = 0, indices_1 = indices; _i < indices_1.length; _i++) {
                        index = indices_1[_i];
                        if (index.data) {
                            console.log("   ".concat(index.name, ": ").concat(index.data.current.toFixed(2), " (").concat(index.data.percent_change > 0 ? '+' : '').concat(index.data.percent_change.toFixed(2), "%)"));
                        }
                    }
                    // Analyse finale
                    console.log('\n📋 Analyse des résultats:');
                    if (esData && sp500Data) {
                        if (esData.current === sp500Data.current && sp500Data.symbol.includes('ES_FUTURES')) {
                            console.log('✅ Succès: Les données ES Futures sont utilisées directement');
                        }
                        else if (sp500Data.symbol.includes('ES_FROM_SPY') || sp500Data.symbol.includes('ES_FROM_QQQ')) {
                            console.log('⚠️ Fallback: Les ETFs sont utilisés comme approximation');
                            console.log('   💡 Recommandation: Vérifier les symboles futures avec Finnhub');
                        }
                        else {
                            console.log('❌ Incohérence: Vérifier l\'implémentation');
                        }
                    }
                    else if (sp500Data) {
                        console.log('⚡ Partiel: Données récupérées via ETFs (ES Futures non disponibles)');
                    }
                    else {
                        console.log('❌ Échec: Aucune donnée S&P500 récupérée');
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _j.sent();
                    console.error('❌ Erreur lors du test:', error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Exécuter le test
testSP500Futures()
    .then(function () {
    console.log('\n🎉 Test terminé');
    process.exit(0);
})
    .catch(function (error) {
    console.error('💥 Test échoué:', error);
    process.exit(1);
});
