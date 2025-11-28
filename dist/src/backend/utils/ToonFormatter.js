"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToonFormatter = void 0;
/**
 * Utilitaire de formatage TOON (Token-Oriented Object Notation)
 * Optimise la sérialisation des données pour les prompts LLM.
 */
var ToonFormatter = /** @class */ (function () {
    function ToonFormatter() {
    }
    /**
     * Convertit un tableau d'objets JSON en format TOON tabulaire.
     * @param keyName Le nom de la clé parente (ex: "users")
     * @param data Tableau d'objets uniformes
     */
    ToonFormatter.arrayToToon = function (keyName, data) {
        if (!data || data.length === 0)
            return "".concat(keyName, "[0]{}:");
        // Récupération des clés du premier objet pour définir les colonnes
        var columns = Object.keys(data[0]);
        var count = data.length;
        // En-tête: users[2]{id,name,role}:
        var output = "".concat(keyName, "[").concat(count, "]{").concat(columns.join(','), "}:\n");
        // Lignes de données
        output += data
            .map(function (item) {
            return ('  ' +
                columns
                    .map(function (col) {
                    var val = item[col];
                    // Gestion basique des types (string, number, boolean)
                    if (typeof val === 'string') {
                        // Si contient des virgules, on pourrait devoir échapper,
                        // mais pour l'exemple simple on garde brut ou on remplace
                        return val.includes(',') ? "\"".concat(val, "\"") : val;
                    }
                    return String(val);
                })
                    .join(','));
        })
            .join('\n');
        return output;
    };
    /**
     * Convertit un objet JSON complet en TOON (récursif simplifié ou hybride)
     */
    ToonFormatter.jsonToToon = function (json) {
        var output = '';
        for (var _i = 0, _a = Object.entries(json); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                // Détection de tableau d'objets -> Format Tabulaire
                output += this.arrayToToon(key, value) + '\n';
            }
            else {
                // Fallback simple pour les autres types (clé: valeur)
                output += "".concat(key, ": ").concat(JSON.stringify(value), "\n");
            }
        }
        return output.trim();
    };
    return ToonFormatter;
}());
exports.ToonFormatter = ToonFormatter;
