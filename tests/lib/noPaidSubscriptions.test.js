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
 it('has no payment providers, checkout paths or paid entitlements in application resources', () => {
  const files = ['src', 'base44', 'ios', 'android', 'scripts'].flatMap(filesUnder)
   .filter(file => /\.(jsx?|tsx?|jsonc?|swift|java|kt|gradle|xml|plist|pbxproj)$/.test(file));
  const retired = /PendingSubscription|createCheckout|cancelSubscription|getSubscriptionStatus|tranzila|revenuecat|@stripe|stripe-js|wix-payments|is_ruumr_plus|ruumr_plus_source|ruumr_plus_expires_at|RuumrPlusPricing|RuumrPlusCheckout|ManageSubscription|activateRevenueCatPlus|BillingClient|Purchases\.configure/i;
  const matches = files.filter(file => retired.test(file) || retired.test(fs.readFileSync(file, 'utf8')));
  expect(matches).toEqual([]);
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
