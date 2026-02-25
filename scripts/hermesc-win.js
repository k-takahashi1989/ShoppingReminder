/**
 * Windows 用 hermesc ラッパー
 * WSL (Windows Subsystem for Linux) 経由で linux64-bin/hermesc を呼び出す。
 *
 * React Native の Gradle プラグインは Windows では cmd /c 経由でこのスクリプトを呼び出す。
 * 引数のファイルパスは相対パス (例: android\app\build\...) で渡されるため、
 * 絶対 Windows パスに解決したうえで WSL マウントパス (/mnt/c/...) に変換する。
 *
 * 使い方 (android/app/build.gradle):
 *   react {
 *     hermesCommand = "node ${rootDir}/../scripts/hermesc-win.js"
 *   }
 */

const { execFileSync } = require('child_process');
const path = require('path');

const HERMESC_LINUX = path.join(
  __dirname,
  '..',
  'node_modules',
  'hermes-compiler',
  'hermesc',
  'linux64-bin',
  'hermesc',
);

/**
 * Windows パス（絶対・相対どちらも）を WSL マウントパスに変換する。
 *   絶対パス: C:\foo\bar    → /mnt/c/foo/bar
 *   相対パス: android\app\  → CWD で絶対化してから /mnt/<drive>/...
 *   フラグ  : -emit-binary  → そのまま
 *   数値や記号だけの文字列  → そのまま
 */
function toWslPath(p) {
  // フラグや数値はそのまま
  if (p.startsWith('-') || !/[\\/]/.test(p)) return p;

  // 絶対 Windows パス (C:\...)
  const abs = /^[A-Za-z]:/.test(p)
    ? p
    : path.resolve(process.cwd(), p); // 相対パスを絶対化

  // C:\... → /mnt/c/...
  const normalized = abs.replace(/\\/g, '/');
  const drive = normalized[0].toLowerCase();
  const rest = normalized.slice(2); // ":/" を除去
  return `/mnt/${drive}${rest}`;
}

const wslHermesc = toWslPath(HERMESC_LINUX);
const wslArgs = process.argv.slice(2).map(toWslPath);

try {
  execFileSync('wsl', ['-d', 'Ubuntu', '--', wslHermesc, ...wslArgs], {
    stdio: 'inherit',
  });
} catch (e) {
  process.exit(e.status || 1);
}
