#!/usr/bin/env node
/**
 * Bump `version` in the repo root `package.json` only.
 *
 * Usage (from repo root):
 *   node scripts/bump.js [major|minor|patch]
 * Default release type: patch
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const ROOT_PKG = path.join(REPO_ROOT, 'package.json');

const VALID = new Set(['major', 'minor', 'patch']);

/** @param {string} version */
function parseSemver(version) {
  const m = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!m) {
    throw new Error(`Invalid semver (expected x.y.z): ${version}`);
  }
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    rest: m[4] ?? '',
  };
}

/** @param {{ major: number; minor: number; patch: number; rest: string }} v @param {'major'|'minor'|'patch'} releaseType */
function bumpSemver(v, releaseType) {
  switch (releaseType) {
    case 'major':
      return `${v.major + 1}.0.0${v.rest}`;
    case 'minor':
      return `${v.major}.${v.minor + 1}.0${v.rest}`;
    case 'patch':
    default:
      return `${v.major}.${v.minor}.${v.patch + 1}${v.rest}`;
  }
}

function main() {
  const raw = process.argv[2];
  const releaseType = raw === undefined || raw === '' ? 'patch' : raw;

  if (!VALID.has(releaseType)) {
    console.error('Usage: node scripts/bump.js [major|minor|patch]');
    console.error('Default: patch');
    process.exit(1);
  }

  if (!fs.existsSync(ROOT_PKG)) {
    console.error(`Missing ${path.relative(REPO_ROOT, ROOT_PKG)}`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf8'));
  if (typeof pkg.version !== 'string') {
    console.error('Root package.json has no string "version" field.');
    process.exit(1);
  }

  const prev = pkg.version;
  const next = bumpSemver(
    parseSemver(prev),
    /** @type {'major'|'minor'|'patch'} */ (releaseType),
  );
  pkg.version = next;
  fs.writeFileSync(ROOT_PKG, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`package.json: ${prev} -> ${next}`);
}

main();
