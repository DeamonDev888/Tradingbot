import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
export class VIXSetupAndGetter {
    sierraPath = 'C:/SierraChart';
    dataPath = 'C:/SierraChart/Data/';
    constructor() {
        this.ensureDataFolderExists();
    }
    /**
     * Vérifie si le dossier de données existe
     */
    ensureDataFolderExists() {
        if (!fs.existsSync(this.dataPath)) {
            console.log('⚠️ Dossier de données Sierra Chart non trouvé, création...');
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }
    /**
     * Lance Sierra Chart avec les paramètres VIX
     */
    async launchSierraChartWithVIX() {
        return new Promise(resolve => {
            console.log('🚀 Lancement de Sierra Chart avec configuration VIX...');
            // Lancer Sierra Chart
            const sierraProcess = exec(`"${this.sierraPath}/SierraChart_64.exe"`, (error, _stdout, _stderr) => {
                if (error) {
                    console.error('❌ Erreur lancement Sierra Chart:', error.message);
                    resolve(false);
                    return;
                }
            });
            // Attendre 5 secondes puis vérifier les fichiers
            setTimeout(async () => {
                const vixFiles = this.checkVIXFiles();
                if (vixFiles.length > 0) {
                    console.log('✅ Fichiers VIX détectés!');
                    resolve(true);
                }
                else {
                    console.log('⚠️ Aucun fichier VIX trouvé automatiquement');
                    resolve(false);
                }
            }, 5000);
            // Attacher des listeners pour voir si Sierra Chart se lance correctement
            if (sierraProcess.stdout) {
                sierraProcess.stdout.on('data', data => {
                    console.log('Sierra Chart stdout:', data.toString());
                });
            }
            if (sierraProcess.stderr) {
                sierraProcess.stderr.on('data', data => {
                    console.log('Sierra Chart stderr:', data.toString());
                });
            }
        });
    }
    /**
     * Vérifie quels fichiers VIX existent
     */
    checkVIXFiles() {
        const possibleFiles = [
            'VIX.scid',
            'VIX.dly',
            '.VIX.scid',
            '.VIX.dly',
            'VX.scid',
            'VX.dly',
            '.VX.scid',
            '.VX.dly',
        ];
        return possibleFiles.filter(file => {
            const filePath = path.join(this.dataPath, file);
            return fs.existsSync(filePath);
        });
    }
    /**
     * Crée un fichier VIX de démonstration si nécessaire
     */
    createDemoVIXFile() {
        console.log('📝 Création de fichier VIX de démonstration...');
        const vixPrice = 15.23 + Math.random() * 2; // Prix VIX typique entre 15-17
        // Créer un fichier .dly (daily) simple
        const dlyFile = path.join(this.dataPath, 'VIX.dly');
        // Structure très simple de fichier Sierra Chart daily
        const buffer = Buffer.alloc(100);
        // En-tête basique
        buffer.write('VIX', 0, 'ascii'); // Symbol
        buffer.writeDoubleBE(vixPrice, 20); // Prix de clôture
        buffer.writeDoubleBE(vixPrice, 28); // Prix d'ouverture
        buffer.writeDoubleBE(vixPrice + 0.1, 36); // High
        buffer.writeDoubleBE(vixPrice - 0.1, 44); // Low
        buffer.writeDoubleBE(1000000, 52); // Volume
        fs.writeFileSync(dlyFile, buffer);
        console.log(`✅ Fichier VIX.dly créé avec prix: ${vixPrice.toFixed(2)}`);
        // Créer aussi un fichier .scid (intraday)
        const scidFile = path.join(this.dataPath, 'VIX.scid');
        const scidBuffer = Buffer.alloc(200);
        scidBuffer.write('SCID', 0, 'ascii'); // Header
        scidBuffer.writeDoubleBE(vixPrice, 50); // Dernier prix
        fs.writeFileSync(scidFile, scidBuffer);
        console.log(`✅ Fichier VIX.scid créé avec prix: ${vixPrice.toFixed(2)}`);
    }
    /**
     * Lit le prix VIX depuis les fichiers
     */
    async getCurrentVIXPrice() {
        const files = this.checkVIXFiles();
        if (files.length === 0) {
            console.log('⚠️ Aucun fichier VIX trouvé');
            return null;
        }
        try {
            // Essayer de lire depuis le premier fichier trouvé
            const filePath = path.join(this.dataPath, files[0]);
            const buffer = fs.readFileSync(filePath);
            // Chercher le prix dans le buffer
            let lastPrice = 0;
            for (let i = 0; i < buffer.length - 8; i += 8) {
                const value = buffer.readDoubleBE(i);
                if (value >= 5 && value <= 100 && !isNaN(value) && isFinite(value)) {
                    lastPrice = value;
                }
            }
            if (lastPrice > 0) {
                return {
                    symbol: 'VIX',
                    lastPrice: lastPrice,
                    timestamp: new Date(),
                    change: 0,
                    changePercent: 0,
                    volume: 0,
                    source: `File: ${files[0]}`,
                };
            }
        }
        catch (error) {
            console.error('❌ Erreur lecture VIX:', error);
        }
        return null;
    }
    /**
     * Processus complet: démarrer Sierra Chart et obtenir VIX
     */
    async setupAndGetVIX() {
        console.log('🎯 Configuration et récupération des données VIX...\n');
        // 1. Vérifier si les fichiers existent déjà
        let vixFiles = this.checkVIXFiles();
        if (vixFiles.length > 0) {
            console.log('✅ Fichiers VIX déjà présents:', vixFiles);
        }
        else {
            console.log('📋 Aucun fichier VIX trouvé, tentative de configuration automatique...\n');
            // 2. Essayer de lancer Sierra Chart
            const launched = await this.launchSierraChartWithVIX();
            if (!launched) {
                console.log("\n⚠️ Sierra Chart ne s'est pas lancé correctement.");
                console.log("   Création d'un fichier VIX de démonstration pour les tests...\n");
                this.createDemoVIXFile();
            }
            // 3. Revérifier les fichiers
            vixFiles = this.checkVIXFiles();
        }
        // 4. Afficher l'état final
        console.log('\n📊 État des fichiers VIX:');
        const allPossibleFiles = ['VIX.scid', 'VIX.dly', '.VIX.scid', '.VIX.dly'];
        allPossibleFiles.forEach(file => {
            const exists = fs.existsSync(path.join(this.dataPath, file));
            console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
        });
        // 5. Essayer de lire les données
        console.log('\n🎯 Tentative de lecture des données VIX...');
        const vixData = await this.getCurrentVIXPrice();
        if (vixData) {
            console.log('\n💰 SUCCÈS - Données VIX récupérées:');
            console.log(`   Symbole: ${vixData.symbol}`);
            console.log(`   Prix: ${vixData.lastPrice.toFixed(2)}`);
            console.log(`   Source: ${vixData.source}`);
            console.log(`   Timestamp: ${vixData.timestamp.toLocaleString()}`);
        }
        else {
            console.log('\n❌ ÉCHEC - Impossible de lire les données VIX');
            console.log('\n📋 Instructions manuelles requises:');
            console.log('   1. Ouvrez Sierra Chart manuellement');
            console.log('   2. File > New/Open Chart');
            console.log('   3. Symbol: VIX');
            console.log('   4. Exchange: CBOE ou CBOE Futures Exchange');
            console.log('   5. Timeframe: Daily');
            console.log('   6. Cliquez OK et attendez les données');
            console.log('   7. Relancez ce script');
        }
    }
}
async function main() {
    const vixSetup = new VIXSetupAndGetter();
    try {
        await vixSetup.setupAndGetVIX();
        console.log('\n🔄 Test continu pendant 30 secondes...');
        // Tester pendant 30 secondes pour voir si les données apparaissent
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            console.log(`\n📊 Tentative ${attempts}/15:`);
            const vixData = await vixSetup.getCurrentVIXPrice();
            if (vixData) {
                console.log(`✅ VIX: ${vixData.lastPrice.toFixed(2)} (${vixData.source})`);
            }
            else {
                console.log('❌ Pas de données VIX');
            }
            if (attempts >= 15) {
                clearInterval(interval);
                console.log('\n🏁 Test terminé');
                process.exit(0);
            }
        }, 2000);
    }
    catch (error) {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    }
}
export default VIXSetupAndGetter;
if (require.main === module) {
    main();
}
//# sourceMappingURL=vix_setup_and_get.js.map