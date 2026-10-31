import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function filesUnder(dir) {
 return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? filesUnder(file) : [file];
 });
}

describe('retired paid subscriptions', () => {
 const retiredEndpoints = ['createCheckout', 'cancelSubscription', 'getSubscriptionStatus', 'tranzilaWebhook', 'wix-payments-webhook', 'activateRevenueCatPlus', 'revenueCatWebhook', 'ruumrPlusBridge', 'reconcileRuumrPlusProfiles', 'ensureBguPlusEntitlement', 'manageBguStudents', 'onProfileDeleted', 'sendNewsletterPreview', 'sendNewsletterBatch'];
 const tombstoneFiles = new Set(retiredEndpoints.map(name => `base44/functions/${name}/entry.ts`));
 const tombstone = "// Retired endpoint: retained only to neutralize the existing platform registration.\nDeno.serve(() => Response.json({ error: 'endpoint_retired' }, { status: 410 }));\n";
 it('keeps every retained legacy endpoint inert with no imports or side effects', () => {
  for (const file of tombstoneFiles) expect(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).toBe(tombstone);
 });
 it('has no payment providers, checkout paths or paid entitlements in application resources', () => {
  const files = ['src', 'base44', 'ios', 'android', 'scripts'].flatMap(filesUnder)
   .filter(file => /\.(jsx?|tsx?|jsonc?|swift|java|kt|gradle|xml|plist|pbxproj)$/.test(file));
  const retired = /PendingSubscription|createCheckout|cancelSubscription|getSubscriptionStatus|tranzila|revenuecat|@stripe|stripe-js|wix-payments|is_ruumr_plus|ruumr_plus_source|ruumr_plus_expires_at|RuumrPlusPricing|RuumrPlusCheckout|ManageSubscription|activateRevenueCatPlus|BillingClient|Purchases\.configure/i;
  const matches = files.filter(file => {
   const normalized = file.replace(/\\/g, '/');
   if (tombstoneFiles.has(normalized) || normalized === 'base44/entities/PendingSubscription.jsonc') return false;
   let content = fs.readFileSync(file, 'utf8');
   if (normalized === 'base44/functions/deleteAccount/entry.ts') {
    content = content.replace('await drain(sr.PendingSubscription, { user_id: userId });', '');
   }
   return retired.test(file) || retired.test(content);
  });
  expect(matches).toEqual([]);
 });
 it('retains historical billing only for administrators and cleans it up with the account', () => {
  const schema = JSON.parse(fs.readFileSync('base44/entities/PendingSubscription.jsonc', 'utf8'));
  for (const operation of ['create', 'read', 'update', 'delete']) {
   expect(schema.rls[operation]).toEqual({ user_condition: { role: 'admin' } });
  }
  const cleanup = fs.readFileSync('base44/functions/deleteAccount/entry.ts', 'utf8');
  expect(cleanup).toContain('await drain(sr.PendingSubscription, { user_id: userId });');
  expect(cleanup).toContain('await drain(sr.ProfileBoost, { user_id: userId });');
 });

 it('does not install a payment SDK, including through the lockfile', () => {
  for (const file of ['package.json', 'package-lock.json']) {
   expect(fs.readFileSync(file, 'utf8')).not.toMatch(/@revenuecat|@stripe|stripe-js|purchases-capacitor/i);
  }
 });

 it('does not retain paid subscription fields or required constraints on User', () => {
  const user = JSON.parse(fs.readFileSync('base44/entities/User.jsonc', 'utf8'));
  expect(JSON.stringify(user)).not.toMatch(/ruumr_plus|subscription|checkout|payment/i);
 });
});
