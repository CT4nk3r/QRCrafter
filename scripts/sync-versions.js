const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootPackagePath = path.join(rootDir, 'package.json');
const rootLockPath = path.join(rootDir, 'package-lock.json');
const webPackagePath = path.join(rootDir, 'web', 'package.json');
const webLockPath = path.join(rootDir, 'web', 'package-lock.json');
const tauriConfigPath = path.join(
  rootDir,
  'web',
  'src-tauri',
  'tauri.conf.json',
);
const checkOnly = process.argv.includes('--check');

const readJson = filePath => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const writeJson = (filePath, data) => {
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
};

const rootPackage = readJson(rootPackagePath);
const version = rootPackage.version;

if (!version || typeof version !== 'string') {
  throw new Error('Root package.json is missing a valid version field.');
}

const webPackage = readJson(webPackagePath);
const rootLock = readJson(rootLockPath);
const webLock = readJson(webLockPath);
const tauriConfig = readJson(tauriConfigPath);

if (checkOnly) {
  const versions = [
    ['package.json', rootPackage.version],
    ['package-lock.json', rootLock.version],
    ['package-lock.json packages root', rootLock.packages?.['']?.version],
    ['web/package.json', webPackage.version],
    ['web/package-lock.json', webLock.version],
    ['web/package-lock.json packages root', webLock.packages?.['']?.version],
    ['web/src-tauri/tauri.conf.json', tauriConfig.version],
  ];
  const mismatches = versions.filter(([, candidate]) => candidate !== version);

  if (mismatches.length > 0) {
    const details = mismatches
      .map(([label, candidate]) => `${label}: ${candidate ?? 'missing'}`)
      .join('\n');
    throw new Error(`Version mismatch. Expected ${version}.\n${details}`);
  }

  console.log(`Versions in sync at ${version}`);
  process.exit(0);
}

webPackage.version = version;
writeJson(webPackagePath, webPackage);

rootLock.version = version;
if (rootLock.packages?.['']) {
  rootLock.packages[''].version = version;
}
writeJson(rootLockPath, rootLock);

webLock.version = version;
if (webLock.packages?.['']) {
  webLock.packages[''].version = version;
}
writeJson(webLockPath, webLock);

tauriConfig.version = version;
writeJson(tauriConfigPath, tauriConfig);

console.log(`Synced versions to ${version}`);
