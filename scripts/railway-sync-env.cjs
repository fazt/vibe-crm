#!/usr/bin/env node
/**
 * Sync .env vars to Railway services (api + web). Skips DATABASE_URL on api (uses reference).
 */
const fs = require('fs');
const { execSync } = require('child_process');

const PROJECT = '5e6cc151-51da-478b-9a41-ce6a0afd5be9';
const ENV = 'production';
const API_SERVICE = 'api';
const WEB_SERVICE = 'web';

const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i);
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}

function run(cmd) {
  execSync(cmd, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      RAILWAY_CALLER: 'skill:use-railway@1.2.4',
      RAILWAY_AGENT_SESSION: 'railway-skill-vibe-crm',
    },
  });
}

function setVar(service, key, value, skipDeploy = true) {
  const escaped = value.replace(/"/g, '\\"');
  run(
    `railway variable set ${key}="${escaped}" --service ${service} --project ${PROJECT} --environment ${ENV}${skipDeploy ? ' --skip-deploys' : ''}`,
  );
}

// API core
setVar(API_SERVICE, 'DATABASE_URL', '${{Postgres.DATABASE_URL}}');
setVar(API_SERVICE, 'RAILPACK_NODE_VERSION', '22');

const apiKeys = [
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRES',
  'JWT_REFRESH_EXPIRES',
  'SPACES_KEY',
  'SPACES_SECRET',
  'SPACES_BUCKET',
  'SPACES_ENDPOINT',
  'SPACES_PUBLIC_URL',
  'SPACES_REGION',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'CONTACT_EMAIL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STUDIO_MONTHLY',
  'STRIPE_PRICE_STUDIO_YEARLY',
  'STRIPE_PRICE_AGENCY_MONTHLY',
  'STRIPE_PRICE_AGENCY_YEARLY',
  'STRIPE_TRIAL_DAYS',
  'SUPERADMIN_EMAIL',
];

for (const key of apiKeys) {
  if (env[key]) setVar(API_SERVICE, key, env[key]);
}

// Placeholders updated after domains
if (env.WEB_URL) setVar(API_SERVICE, 'WEB_URL', env.WEB_URL);
if (env.GITHUB_CALLBACK_URL) setVar(API_SERVICE, 'GITHUB_CALLBACK_URL', env.GITHUB_CALLBACK_URL);
if (env.NEXT_PUBLIC_API_URL) setVar(WEB_SERVICE, 'NEXT_PUBLIC_API_URL', env.NEXT_PUBLIC_API_URL);

setVar(WEB_SERVICE, 'RAILPACK_NODE_VERSION', '22');

console.log('Variables synced.');
