import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = path.resolve(process.cwd());
const androidRoot = path.join(repoRoot, 'android');
const adbSerial = process.env.ADB_SERIAL || 'emulator-5556';

function resolveJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }

  const candidates = [
    '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
    '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
    '/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
    '/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

const javaHome = resolveJavaHome();

if (!javaHome) {
  throw new Error('Unable to find a Java 21/17 installation. Set JAVA_HOME before running Android build.');
}

const env = {
  ...process.env,
  VITE_RUUMR_SIMULATOR_MODE: process.env.VITE_RUUMR_SIMULATOR_MODE || 'true',
  JAVA_HOME: javaHome,
};

execSync('npm run android:sync', { stdio: 'inherit', env, cwd: repoRoot });
execSync('./gradlew installDebug', { stdio: 'inherit', env, cwd: androidRoot });
execSync(
  `adb -s ${adbSerial} shell monkey -p com.ruumr.app.android -c android.intent.category.LAUNCHER --pct-syskeys 0 1`,
  { stdio: 'inherit', env, cwd: repoRoot }
);
