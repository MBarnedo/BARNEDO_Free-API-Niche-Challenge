#!/usr/bin/env bash
set -euo pipefail
export PATH="/c/Users/XU/AppData/Local/Programs/Git/bin:/c/Users/XU/AppData/Local/Programs/Git/usr/bin:/c/Users/XU/AppData/Local/Programs/gh:/c/Users/XU/AppData/Local/Programs/Git/mingw64/bin:$PATH"
cd /c/Users/XU/lexicon-scrapbook

echo "=== env ==="
echo "shell=$SHELL"
command -v git
command -v bash
command -v gh || ls -la /c/Users/XU/AppData/Local/Programs/gh || ls -la /c/Users/XU/AppData/Local/Temp/gh-extract || true
command -v node || true
command -v npm || true
ls /c/Users/XU/AppData/Local/Programs/gh 2>/dev/null || true
find /c/Users/XU/AppData/Local/Temp/gh-extract -name gh.exe 2>/dev/null | head
find /c/Users/XU -maxdepth 4 -name nvm.sh 2>/dev/null | head
ls /c/Users/XU/AppData/Roaming/nvm 2>/dev/null || true
ls /c/Program\ Files/nodejs 2>/dev/null || true

echo "=== git ==="
git status -sb
git remote -v
git log -1 --oneline

echo "=== gh auth ==="
if command -v gh >/dev/null; then
  gh --version
  gh auth status || true
else
  echo "gh not on PATH"
fi
