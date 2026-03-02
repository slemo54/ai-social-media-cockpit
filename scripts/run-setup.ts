#!/usr/bin/env tsx
/**
 * Script Runner Principale
 * Esegue l'intero setup del sistema template Thumio-style
 */

import { spawn } from 'child_process';
import * as path from 'path';

interface Step {
  name: string;
  description: string;
  script: string;
  critical: boolean;
}

const STEPS: Step[] = [
  {
    name: 'Database Setup',
    description: 'Crea tabelle e inserisce dati iniziali',
    script: 'setup-template-database.ts',
    critical: true
  },
  {
    name: 'Asset Generation',
    description: 'Genera silhouette placeholder e assets grafici',
    script: 'generate-template-assets.ts',
    critical: false
  },
  {
    name: 'Template Base Generation',
    description: 'Genera template base con Gemini API',
    script: 'generate-template-bases.ts',
    critical: false
  }
];

function runScript(scriptPath: string): Promise<number> {
  return new Promise((resolve) => {
    const fullPath = path.resolve(__dirname, scriptPath);
    console.log(`   📜 Esecuzione: ${scriptPath}\n`);
    
    const child = spawn('npx', ['tsx', fullPath], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    child.on('close', (code) => {
      resolve(code || 0);
    });

    child.on('error', (err) => {
      console.error(`   ❌ Errore esecuzione: ${err.message}`);
      resolve(1);
    });
  });
}

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     🚀 AI SOCIAL COCKPIT - TEMPLATE SYSTEM SETUP        ║');
  console.log('║         Integrazione Thumio-style + Dual-API            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  const results: { step: Step; success: boolean; code: number }[] = [];

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📌 Step ${i + 1}/${STEPS.length}: ${step.name}`);
    console.log(`   ${step.description}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const code = await runScript(step.script);
    const success = code === 0;
    
    results.push({ step, success, code });

    if (!success) {
      console.log(`\n   ⚠️  Step completato con codice: ${code}`);
      if (step.critical) {
        console.log(`   ❌ Step critico fallito. Arresto.`);
        break;
      }
    }

    // Pausa tra step
    if (i < STEPS.length - 1) {
      console.log(`\n   ⏳ Procedo allo step successivo...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Riepilogo finale
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    RIEPILOGO FINALE                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  results.forEach(({ step, success, code }) => {
    const icon = success ? '✅' : step.critical ? '❌' : '⚠️';
    const status = success ? 'OK' : code === 0 ? 'OK' : `Exit ${code}`;
    console.log(`   ${icon} ${step.name.padEnd(25)} ${status}`);
  });

  const allCriticalSuccess = results
    .filter(r => r.step.critical)
    .every(r => r.success);

  const anySuccess = results.some(r => r.success);

  console.log('\n');
  
  if (allCriticalSuccess && anySuccess) {
    console.log('🎉 Setup completato con successo!');
    console.log('\nProssimi passi:');
    console.log('   1. Verifica i file generati in /public/templates/');
    console.log('   2. Controlla il database Supabase');
    console.log('   3. Avvia l\'app: npm run dev');
    console.log('   4. Visita /templates per vedere la gallery\n');
  } else if (!allCriticalSuccess) {
    console.log('❌ Setup fallito. Controlla gli errori sopra.\n');
    process.exit(1);
  } else {
    console.log('⚠️  Setup parziale completato. Alcuni step opzionali falliti.\n');
  }
}

main().catch(err => {
  console.error('❌ Errore imprevisto:', err);
  process.exit(1);
});
