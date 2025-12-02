#!/usr/bin/env ts-node

import * as path from 'path';
import { DatabaseAnalysisAgent } from '../agents/DatabaseAnalysisAgent';
import * as dotenv from 'dotenv';

dotenv.config();

async function runDatabaseAnalysis(
  options: {
    health?: boolean;
    quality?: boolean;
    scrapers?: boolean;
    documentation?: boolean;
    optimize?: boolean;
    all?: boolean;
  } = {}
) {
  console.log('🚀 Starting Database Analysis Agent...\n');

  const agent = new DatabaseAnalysisAgent();
  const results: any = {};

  try {
    const runAll = options.all || Object.keys(options).length === 0;

    // Health Analysis
    if (runAll || options.health) {
      console.log('📊 Running Database Health Analysis...');
      results.health = await agent.analyzeDatabaseHealth();
      console.log(
        `✅ Health Score: ${results.health.health_score}/100 (${results.health.overall_health})\n`
      );
    }

    // Data Quality Assessment
    if (runAll || options.quality) {
      console.log('📋 Running Data Quality Assessment...');
      results.quality = await agent.assessDataQuality();
      console.log(`✅ Assessed ${results.quality.length} tables\n`);
    }

    // Scraper Performance Analysis
    if (runAll || options.scrapers) {
      console.log('⚡ Running Scraper Performance Analysis...');
      results.scrapers = await agent.analyzeScraperPerformance();
      console.log(`✅ Analyzed ${results.scrapers.length} scrapers\n`);
    }

    // Documentation Generation
    if (runAll || options.documentation) {
      console.log('📝 Generating Documentation...');
      results.documentation = await agent.generateDocumentation();
      console.log('✅ Documentation generated\n');
    }

    // Optimization Execution
    if (options.optimize) {
      console.log('🔧 Executing Optimizations...');
      results.optimizations = await agent.executeOptimizations();
      console.log(
        `✅ Applied ${results.optimizations.optimizations_applied.length} optimizations\n`
      );
    }

    // Summary
    console.log('🎉 Database Analysis Complete!\n');

    if (results.health) {
      console.log(
        `📊 Database Health: ${results.health.overall_health.toUpperCase()} (${results.health.health_score}/100)`
      );
      console.log(`🔍 Issues Found: ${results.health.issues.length}`);
      console.log(`💡 Recommendations: ${results.health.recommendations.length}`);
    }

    if (results.quality) {
      console.log(`📋 Tables Assessed: ${results.quality.length}`);
    }

    if (results.scrapers) {
      console.log(`⚡ Scrapers Analyzed: ${results.scrapers.length}`);
    }

    if (results.documentation) {
      console.log('📄 Documentation: docs/DATABASE_ANALYSIS_REPORT.md');
    }

    if (results.optimizations) {
      console.log(
        `🔧 Optimizations Applied: ${results.optimizations.optimizations_applied.length}`
      );
      if (results.optimizations.errors.length > 0) {
        console.log(`⚠️ Errors: ${results.optimizations.errors.length}`);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Database analysis failed:', error);
    throw error;
  } finally {
    await agent.close();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options: any = {};

  // Parse command line arguments
  args.forEach(arg => {
    switch (arg) {
      case '--health':
        options.health = true;
        break;
      case '--quality':
        options.quality = true;
        break;
      case '--scrapers':
        options.scrapers = true;
        break;
      case '--documentation':
        options.documentation = true;
        break;
      case '--optimize':
        options.optimize = true;
        break;
      case '--all':
        options.all = true;
        break;
      case '--help':
        console.log(`
Database Analysis Agent

Usage: ts-node run_database_analysis.ts [options]

Options:
  --health         Run database health analysis
  --quality        Run data quality assessment
  --scrapers       Run scraper performance analysis
  --documentation  Generate documentation
  --optimize       Execute optimizations (CAUTION: modifies data)
  --all           Run all analyses (default if no options specified)
  --help          Show this help

Examples:
  ts-node run_database_analysis.ts --all
  ts-node run_database_analysis.ts --health --quality
  ts-node run_database_analysis.ts --documentation
        `);
        process.exit(0);
    }
  });

  try {
    await runDatabaseAnalysis(options);
    console.log('\n✅ Analysis completed successfully');
  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { runDatabaseAnalysis };

// Run if called directly
if (require.main === module) {
  main();
}
