"use strict";
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
exports.BaseAgentSimple = void 0;
var child_process_1 = require("child_process");
var util_1 = require("util");
var fs = require("fs/promises");
var path = require("path");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
var BaseAgentSimple = /** @class */ (function () {
    function BaseAgentSimple(name) {
        this.agentName = name;
        this.dataDir = path.join(process.cwd(), 'data', 'agent-data', name);
    }
    /**
     * Exécute KiloCode avec une approche robuste et simple
     */
    BaseAgentSimple.prototype.callKiloCode = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var fullOutputPath, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fullOutputPath = path.join(process.cwd(), req.outputFile);
                        console.log("[".concat(this.agentName, "] Preparing KiloCode execution..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!(req.prompt.length > 1000)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.executeWithFile(req, fullOutputPath)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [4 /*yield*/, this.executeDirect(req, fullOutputPath)];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        console.error("[".concat(this.agentName, "] KiloCode execution failed:"), error_1);
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Exécute avec un fichier temporaire
     */
    BaseAgentSimple.prototype.executeWithFile = function (req, fullOutputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var tempPromptPath, command, stdout, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tempPromptPath = path.join(process.cwd(), 'temp_prompt.txt');
                        return [4 /*yield*/, fs.writeFile(tempPromptPath, req.prompt, 'utf-8')];
                    case 1:
                        _b.sent();
                        command = "cat \"".concat(tempPromptPath, "\" | kilocode -m ask --auto --json");
                        console.log("[".concat(this.agentName, "] Using file-based execution for large prompt (").concat(req.prompt.length, " chars)"));
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 5, 9]);
                        return [4 /*yield*/, execAsync(command, {
                                timeout: 120000, // 2 minutes
                                cwd: process.cwd(),
                            })];
                    case 3:
                        stdout = (_b.sent()).stdout;
                        return [4 /*yield*/, fs.writeFile(fullOutputPath, stdout, 'utf-8')];
                    case 4:
                        _b.sent();
                        return [2 /*return*/, this.parseKiloCodeOutput(stdout)];
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, fs.unlink(tempPromptPath)];
                    case 6:
                        _b.sent();
                        console.log("[".concat(this.agentName, "] Cleaned up temporary file"));
                        return [3 /*break*/, 8];
                    case 7:
                        _a = _b.sent();
                        return [3 /*break*/, 8];
                    case 8: return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Exécute directement en ligne de commande
     */
    BaseAgentSimple.prototype.executeDirect = function (req, fullOutputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var escapedPrompt, command, fullInputPath, stdout;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        escapedPrompt = req.prompt.replace(/"/g, '\\"');
                        command = "kilocode -m ask --auto --json \"".concat(escapedPrompt, "\"");
                        if (req.inputFile) {
                            fullInputPath = path.join(process.cwd(), req.inputFile);
                            command = "cat \"".concat(fullInputPath, "\" | ").concat(command);
                        }
                        console.log("[".concat(this.agentName, "] Executing direct command"));
                        return [4 /*yield*/, execAsync(command, {
                                timeout: 120000, // 2 minutes
                                cwd: process.cwd(),
                            })];
                    case 1:
                        stdout = (_a.sent()).stdout;
                        return [4 /*yield*/, fs.writeFile(fullOutputPath, stdout, 'utf-8')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.parseKiloCodeOutput(stdout)];
                }
            });
        });
    };
    /**
     * Parse le output KiloCode avec priorité aux metadata
     */
    BaseAgentSimple.prototype.parseKiloCodeOutput = function (stdoutData) {
        console.log("[".concat(this.agentName, "] Parsing KiloCode output (").concat(stdoutData.length, " chars)"));
        // Parser les lignes NDJSON
        var lines = stdoutData.split('\n').filter(function (line) { return line.trim() !== ''; });
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            try {
                var event_1 = JSON.parse(line);
                // Priorité absolue: JSON dans metadata (le plus fiable)
                if (event_1.metadata &&
                    (event_1.metadata.sentiment || event_1.metadata.score || event_1.metadata.catalysts)) {
                    console.log("[".concat(this.agentName, "] Found JSON in metadata"));
                    return this.validateAndCleanJson(event_1.metadata);
                }
                // Deuxième priorité: completion_result content
                if (event_1.type === 'completion_result' && event_1.content) {
                    var jsonInContent = this.extractJson(event_1.content);
                    if (jsonInContent) {
                        console.log("[".concat(this.agentName, "] Found JSON in completion_result"));
                        return this.validateAndCleanJson(jsonInContent);
                    }
                }
                // Troisième priorité: text content (sauf reasoning)
                if (event_1.type === 'say' && event_1.say !== 'reasoning' && event_1.content) {
                    var jsonInContent = this.extractJson(event_1.content);
                    if (jsonInContent) {
                        console.log("[".concat(this.agentName, "] Found JSON in text content"));
                        return this.validateAndCleanJson(jsonInContent);
                    }
                }
            }
            catch (_a) {
                // Ignorer les lignes non-JSON
            }
        }
        // Fallback: chercher JSON dans tout le stdout
        var jsonInStdout = this.extractJson(stdoutData);
        if (jsonInStdout) {
            console.log("[".concat(this.agentName, "] Found JSON in stdout fallback"));
            return this.validateAndCleanJson(jsonInStdout);
        }
        throw new Error('No valid JSON found in KiloCode output');
    };
    /**
     * Extrait le JSON d'un texte
     */
    BaseAgentSimple.prototype.extractJson = function (text) {
        // Chercher les objets JSON complets
        var jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (!jsonMatch)
            return null;
        try {
            return JSON.parse(jsonMatch[0]);
        }
        catch (_a) {
            return null;
        }
    };
    /**
     * Valide et nettoie le JSON pour le SentimentAgent
     */
    BaseAgentSimple.prototype.validateAndCleanJson = function (parsed) {
        var _a, _b;
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid JSON structure');
        }
        // Valider les champs requis pour le SentimentAgent
        var parsedObj = parsed;
        var hasSentiment = parsedObj.sentiment && typeof parsedObj.sentiment === 'string';
        var hasValidSentiment = ['BULLISH', 'BEARISH', 'NEUTRAL'].includes((_a = parsedObj.sentiment) === null || _a === void 0 ? void 0 : _a.toUpperCase());
        var hasScore = typeof parsedObj.score === 'number';
        var hasRiskLevel = ['LOW', 'MEDIUM', 'HIGH'].includes((_b = parsedObj.risk_level) === null || _b === void 0 ? void 0 : _b.toUpperCase());
        var hasCatalysts = Array.isArray(parsedObj.catalysts);
        var hasSummary = typeof parsedObj.summary === 'string';
        if (!hasSentiment ||
            !hasValidSentiment ||
            !hasScore ||
            !hasRiskLevel ||
            !hasCatalysts ||
            !hasSummary) {
            console.warn("[".concat(this.agentName, "] JSON structure incomplete, but returning anyway"));
        }
        // Nettoyer et normaliser
        return {
            sentiment: hasValidSentiment ? parsedObj.sentiment.toUpperCase() : 'NEUTRAL',
            score: hasScore ? parsedObj.score : 0,
            risk_level: hasRiskLevel ? parsedObj.risk_level.toUpperCase() : 'MEDIUM',
            catalysts: hasCatalysts ? parsedObj.catalysts : [],
            summary: hasSummary ? parsedObj.summary : 'Aucun résumé disponible',
        };
    };
    return BaseAgentSimple;
}());
exports.BaseAgentSimple = BaseAgentSimple;
