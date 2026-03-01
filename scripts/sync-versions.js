const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootPackagePath = path.join(rootDir, 'package.json');
const webPackagePath = path.join(rootDir, 'web', 'package.json');
const tauriConfigPath = path.join(rootDir, 'web', 'src-tauri', 'tauri.conf.json');

const readJson = (filePath) => {
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
webPackage.version = version;
writeJson(webPackagePath, webPackage);

const tauriConfig = readJson(tauriConfigPath);
tauriConfig.version = version;
writeJson(tauriConfigPath, tauriConfig);

console.log(`Synced versions to ${version}`);
