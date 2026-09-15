#!/usr/bin/env node

/**
 * LoopDev Environment & Supabase Doctor
 * Diagnostic tool to verify Supabase connectivity across any IDE/computer (VS Code, Copilot, Codespaces, etc.)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

console.log(`\n${colors.bold}${colors.cyan}=== LoopDev Environment & Supabase Doctor ===${colors.reset}\n`);

// 1. Check .env file
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

let envConfig = {};

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log(`${colors.yellow}⚠ .env file not found. Auto-generating from .env.example...${colors.reset}`);
    fs.copyFileSync(envExamplePath, envPath);
    console.log(`${colors.green}✔ Created .env successfully.${colors.reset}`);
  } else {
    console.log(`${colors.red}✖ Neither .env nor .env.example found!${colors.reset}`);
  }
} else {
  console.log(`${colors.green}✔ .env file exists.${colors.reset}`);
}

// Parse .env manually to avoid extra dependencies
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      envConfig[key.trim()] = rest.join('=').trim();
    }
  }
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://sukjcsylkljiyvfklxvj.supabase.co';
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845';

console.log(`${colors.gray}Target Supabase URL: ${supabaseUrl}${colors.reset}`);
console.log(`${colors.gray}Target Anon Key: ${supabaseKey.substring(0, 16)}...${colors.reset}\n`);

async function runDiagnostics() {
  let passed = 0;
  let total = 4;

  // Test 1: Auth Settings Ping
  try {
    process.stdout.write(`1. Checking Supabase Auth Service... `);
    const resp = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseKey },
    });
    if (resp.ok) {
      console.log(`${colors.green}OK (${resp.status})${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}FAILED (${resp.status})${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}ERROR: ${err.message}${colors.reset}`);
  }

  // Test 2: REST API Ping (Contacts Table)
  try {
    process.stdout.write(`2. Checking Supabase REST Database (crm_contacts)... `);
    const resp = await fetch(`${supabaseUrl}/rest/v1/crm_contacts?select=id&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (resp.ok) {
      console.log(`${colors.green}OK (${resp.status})${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}FAILED (${resp.status} - ${await resp.text()})${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}ERROR: ${err.message}${colors.reset}`);
  }

  // Test 3: REST API Ping (Organizations Table)
  try {
    process.stdout.write(`3. Checking Supabase Organizations (multi-tenant)... `);
    const resp = await fetch(`${supabaseUrl}/rest/v1/organizations?select=id,name&limit=5`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (resp.ok) {
      const orgs = await resp.json();
      console.log(`${colors.green}OK (${orgs.length} orgs found: ${orgs.map(o => o.name).join(', ')})${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}FAILED (${resp.status})${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}ERROR: ${err.message}${colors.reset}`);
  }

  // Test 4: Live Demo Account Authentication (admin@loop.dev / loopdev)
  try {
    process.stdout.write(`4. Testing Demo Account Login (admin@loop.dev)... `);
    const resp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@loop.dev',
        password: 'loopdev',
      }),
    });
    if (resp.ok) {
      const authData = await resp.json();
      console.log(`${colors.green}OK (Authenticated as user ${authData.user?.email})${colors.reset}`);
      passed++;
    } else {
      const err = await resp.json().catch(() => ({}));
      console.log(`${colors.red}FAILED (${resp.status}: ${err.error_description || err.message})${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}ERROR: ${err.message}${colors.reset}`);
  }

  console.log(`\n------------------------------------------------------------`);
  if (passed === total) {
    console.log(`${colors.bold}${colors.green}✔ ALL CHECKS PASSED (${passed}/${total})! Your environment is ready to work with Supabase.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.red}✖ ${total - passed} checks failed (${passed}/${total}). Check network or credentials.${colors.reset}\n`);
    process.exit(1);
  }
}

runDiagnostics();
