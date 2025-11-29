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
exports.TradingEconomicsScraper = void 0;
var playwright_1 = require("playwright");
var pg_1 = require("pg");
var dotenv = require("dotenv");
var fs = require("fs");
dotenv.config();
var TradingEconomicsScraper = /** @class */ (function () {
    function TradingEconomicsScraper() {
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    TradingEconomicsScraper.prototype.scrapeUSCalendar = function () {
        return __awaiter(this, void 0, void 0, function () {
            var log, browser, context, page, url, events, rows, currentDate, _i, rows_1, row, firstTdClass, dateMatch, firstTdText, country, eventLink, time, eventName, importance, actual, forecast, previous, currency, dateTimeStr, eventDate, validDate, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log = function (msg) {
                            console.log(msg);
                            try {
                                fs.appendFileSync('scraper_debug.log', msg + '\n');
                            }
                            catch (_a) {
                                // Ignore file write errors
                            }
                        };
                        log('🚀 Starting TradingEconomics US Calendar Scraper...');
                        return [4 /*yield*/, playwright_1.chromium.launch({ headless: true })];
                    case 1:
                        browser = _a.sent();
                        return [4 /*yield*/, browser.newContext({
                                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            })];
                    case 2:
                        context = _a.sent();
                        return [4 /*yield*/, context.newPage()];
                    case 3:
                        page = _a.sent();
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 22, 23, 25]);
                        url = 'https://tradingeconomics.com/united-states/calendar';
                        log("\uD83C\uDF10 Navigating to: ".concat(url));
                        return [4 /*yield*/, page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })];
                    case 5:
                        _a.sent();
                        // Wait for the table to load
                        return [4 /*yield*/, page.waitForSelector('#calendar', { timeout: 30000 })];
                    case 6:
                        // Wait for the table to load
                        _a.sent();
                        events = [];
                        return [4 /*yield*/, page.$$('table#calendar > tbody > tr')];
                    case 7:
                        rows = _a.sent();
                        currentDate = null;
                        log("\uD83D\uDCCA Found ".concat(rows.length, " rows in the calendar table."));
                        _i = 0, rows_1 = rows;
                        _a.label = 8;
                    case 8:
                        if (!(_i < rows_1.length)) return [3 /*break*/, 21];
                        row = rows_1[_i];
                        return [4 /*yield*/, row.$eval('td', function (el) { return el.className; }).catch(function () { return ''; })];
                    case 9:
                        firstTdClass = _a.sent();
                        dateMatch = firstTdClass.match(/(\d{4}-\d{2}-\d{2})/);
                        if (!dateMatch) return [3 /*break*/, 10];
                        currentDate = dateMatch[1]; // Found a date in this row
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, row
                            .$eval('td', function (el) { var _a; return ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; })
                            .catch(function () { return ''; })];
                    case 11:
                        firstTdText = _a.sent();
                        // Simple check if it looks like a date (optional, but good for safety)
                        if (firstTdText && !firstTdText.includes(':')) {
                            // If we really needed to parse "Nov 27", we'd need a year.
                            // For now, let's rely on the class name as primary, but log a warning if we miss it on a header row.
                        }
                        _a.label = 12;
                    case 12:
                        country = 'United States';
                        return [4 /*yield*/, row.$('a.calendar-event')];
                    case 13:
                        eventLink = _a.sent();
                        if (!eventLink)
                            return [3 /*break*/, 20];
                        return [4 /*yield*/, row
                                .$eval('span[class*="calendar-date"]', function (el) { var _a; return ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; })
                                .catch(function () { return ''; })];
                    case 14:
                        time = _a.sent();
                        return [4 /*yield*/, row
                                .$eval('a.calendar-event', function (el) { var _a; return ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; })
                                .catch(function () { return ''; })];
                    case 15:
                        eventName = _a.sent();
                        return [4 /*yield*/, row
                                .$$eval('span.sentiment-star', function (stars) { return stars.length; })
                                .catch(function () { return 0; })];
                    case 16:
                        importance = _a.sent();
                        return [4 /*yield*/, row
                                .$eval('[id*="actual"]', function (el) { var _a; return ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; })
                                .catch(function () { return ''; })];
                    case 17:
                        actual = _a.sent();
                        return [4 /*yield*/, row
                                .$eval('[id*="forecast"]', function (el) { var _a; return ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; })
                                .catch(function () { return ''; })];
                    case 18:
                        forecast = _a.sent();
                        return [4 /*yield*/, row
                                .$eval('[id*="previous"]', function (el) { var _a; return ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; })
                                .catch(function () { return ''; })];
                    case 19:
                        previous = _a.sent();
                        currency = 'USD';
                        if (currentDate && eventName) {
                            dateTimeStr = "".concat(currentDate, " ").concat(time);
                            eventDate = new Date(Date.parse(dateTimeStr));
                            validDate = isNaN(eventDate.getTime()) ? new Date() : eventDate;
                            events.push({
                                date: validDate,
                                country: country,
                                event: eventName,
                                importance: importance,
                                actual: actual,
                                forecast: forecast,
                                previous: previous,
                                currency: currency,
                            });
                        }
                        _a.label = 20;
                    case 20:
                        _i++;
                        return [3 /*break*/, 8];
                    case 21:
                        log("\u2705 Scraped ".concat(events.length, " events successfully."));
                        return [2 /*return*/, events];
                    case 22:
                        error_1 = _a.sent();
                        log("\u274C Error scraping TradingEconomics: ".concat(error_1));
                        return [2 /*return*/, []];
                    case 23: return [4 /*yield*/, browser.close()];
                    case 24:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    TradingEconomicsScraper.prototype.saveEvents = function (events) {
        return __awaiter(this, void 0, void 0, function () {
            var client, savedCount, _i, events_1, event_1, e_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (events.length === 0)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, this.pool.connect()];
                    case 2:
                        client = _a.sent();
                        // Ensure table exists
                        return [4 /*yield*/, client.query("\n        CREATE TABLE IF NOT EXISTS economic_events (\n            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n            event_date TIMESTAMP WITH TIME ZONE,\n            country VARCHAR(100),\n            event_name VARCHAR(500),\n            importance INTEGER,\n            actual VARCHAR(50),\n            forecast VARCHAR(50),\n            previous VARCHAR(50),\n            currency VARCHAR(20),\n            source VARCHAR(50) DEFAULT 'TradingEconomics',\n            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n            UNIQUE(event_date, country, event_name)\n        );\n      ")];
                    case 3:
                        // Ensure table exists
                        _a.sent();
                        savedCount = 0;
                        _i = 0, events_1 = events;
                        _a.label = 4;
                    case 4:
                        if (!(_i < events_1.length)) return [3 /*break*/, 9];
                        event_1 = events_1[_i];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, client.query("\n                INSERT INTO economic_events \n                (event_date, country, event_name, importance, actual, forecast, previous, currency)\n                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n                ON CONFLICT (event_date, country, event_name) \n                DO UPDATE SET \n                    actual = EXCLUDED.actual,\n                    forecast = EXCLUDED.forecast,\n                    previous = EXCLUDED.previous,\n                    importance = EXCLUDED.importance\n            ", [
                                event_1.date,
                                event_1.country,
                                event_1.event,
                                event_1.importance,
                                event_1.actual,
                                event_1.forecast,
                                event_1.previous,
                                event_1.currency,
                            ])];
                    case 6:
                        _a.sent();
                        savedCount++;
                        return [3 /*break*/, 8];
                    case 7:
                        e_1 = _a.sent();
                        console.error("Failed to save event ".concat(event_1.event, ":"), e_1);
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 4];
                    case 9:
                        console.log("\uD83D\uDCBE Saved/Updated ".concat(savedCount, " economic events in database."));
                        client.release();
                        return [3 /*break*/, 11];
                    case 10:
                        error_2 = _a.sent();
                        console.error('❌ Database error:', error_2);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return TradingEconomicsScraper;
}());
exports.TradingEconomicsScraper = TradingEconomicsScraper;
