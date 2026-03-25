/**
 * Real-time Navigation Audit Logging for Back Button Testing
 * Tracks all navigation events and provides hook integration for verification
 */

class NavigationAuditLog {
  constructor() {
    this.history = [];
    this.backPresses = [];
    this.tabSwitches = [];
    this.isEnabled = false;
  }

  enable() {
    this.isEnabled = true;
    console.log('🔵 Navigation audit logging enabled');
  }

  disable() {
    this.isEnabled = false;
    console.log('⚫ Navigation audit logging disabled');
  }

  recordNavigation(pathname) {
    if (!this.isEnabled) return;
    this.history.push({
      timestamp: Date.now(),
      route: pathname,
      type: 'navigation',
    });
  }

  recordBackPress(from, to) {
    if (!this.isEnabled) return;
    this.backPresses.push({
      timestamp: Date.now(),
      from,
      to,
      depth: this.history.length,
    });
  }

  recordTabSwitch(fromTab, toTab) {
    if (!this.isEnabled) return;
    this.tabSwitches.push({
      timestamp: Date.now(),
      from: fromTab,
      to: toTab,
      depthAtSwitch: this.history.length,
    });
  }

  getHistory() {
    return this.history;
  }

  getBackPressLog() {
    return this.backPresses;
  }

  getTabSwitchLog() {
    return this.tabSwitches;
  }

  report() {
    console.log('\n📊 NAVIGATION AUDIT REPORT\n');
    console.log(`Total navigations: ${this.history.length}`);
    console.log(`Back presses: ${this.backPresses.length}`);
    console.log(`Tab switches: ${this.tabSwitches.length}`);

    if (this.backPresses.length > 0) {
      console.log('\n⏪ BACK PRESS LOG:');
      this.backPresses.slice(-10).forEach((bp, i) => {
        console.log(`  ${i + 1}. ${bp.from} → ${bp.to} (depth: ${bp.depth})`);
      });
    }

    if (this.tabSwitches.length > 0) {
      console.log('\n🔄 TAB SWITCH LOG:');
      this.tabSwitches.slice(-5).forEach((ts, i) => {
        console.log(`  ${i + 1}. ${ts.from} → ${ts.to} (depth: ${ts.depthAtSwitch})`);
      });
    }

    console.log('\n✅ Audit report complete\n');
  }

  reset() {
    this.history = [];
    this.backPresses = [];
    this.tabSwitches = [];
  }
}

// Singleton instance
export const navAuditLog = new NavigationAuditLog();

// Hook for React components to integrate with audit
export function useNavigationAudit() {
  return {
    recordNavigation: navAuditLog.recordNavigation.bind(navAuditLog),
    recordBackPress: navAuditLog.recordBackPress.bind(navAuditLog),
    recordTabSwitch: navAuditLog.recordTabSwitch.bind(navAuditLog),
    enable: navAuditLog.enable.bind(navAuditLog),
    disable: navAuditLog.disable.bind(navAuditLog),
    report: navAuditLog.report.bind(navAuditLog),
  };
}