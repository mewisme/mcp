#!/usr/bin/env node
/**
 * Bump `version` in every package.json under `apps/` and `packages/` (recursive).
 * The next semver is computed from the highest `version` among those files, then applied to all of them.
 *
 * Usage (from repo root):
 *   node scripts/bump.js [major|minor|patch]
 * Default release type: patch
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

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

/** @param {string} a @param {string} b @returns {number} */
function compareSemverStrings(a, b) {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (x.major !== y.major) return x.major - y.major;
  if (x.minor !== y.minor) return x.minor - y.minor;
  return x.patch - y.patch;
}

/** @param {string[]} versions */
function maxSemver(versions) {
  if (versions.length === 0) {
    throw new Error('No versions to compare.');
  }
  return versions.reduce((best, v) => (compareSemverStrings(v, best) > 0 ? v : best));
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

/** @param {string} dir */
function findPackageJsonFiles(dir) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} current */
  function walk(current) {
    let names;
    try {
      names = fs.readdirSync(current);
    } catch {
      return;
    }
    for (const name of names) {
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
      const full = path.join(current, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
      } else if (name === 'package.json') {
        out.push(full);
      }
    }
  }
  walk(dir);
  return out.sort();
}

/** Workspace packages only: `apps/**` and `packages/**` (no repo root). */
function collectWorkspacePackageJsonPaths() {
  /** @type {string[]} */
  const files = [];

  for (const name of ['apps', 'packages']) {
    const dir = path.join(REPO_ROOT, name);
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      files.push(...findPackageJsonFiles(dir));
    }
  }

  return [...new Set(files)].sort();
}

function main() {
  const raw = process.argv[2];
  const releaseType = raw === undefined || raw === '' ? 'patch' : raw;

  if (!VALID.has(releaseType)) {
    console.error('Usage: node scripts/bump.js [major|minor|patch]');
    console.error('Default: patch');
    process.exit(1);
  }

  const targets = collectWorkspacePackageJsonPaths();
  if (targets.length === 0) {
    console.error('No package.json files found under apps/ or packages/.');
    process.exit(1);
  }

  /** @type {string[]} */
  const currentVersions = [];
  for (const file of targets) {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (typeof pkg.version === 'string') {
      currentVersions.push(pkg.version);
    }
  }

  if (currentVersions.length === 0) {
    console.error('No string "version" field found in any apps/ or packages/ package.json.');
    process.exit(1);
  }

  const baseVersion = maxSemver(currentVersions);
  const next = bumpSemver(
    parseSemver(baseVersion),
    /** @type {'major'|'minor'|'patch'} */ (releaseType),
  );

  for (const file of targets) {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (typeof pkg.version !== 'string') {
      const rel = path.relative(REPO_ROOT, file);
      console.warn(`skip (no version): ${rel}`);
      continue;
    }
    const prev = pkg.version;
    pkg.version = next;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
    const rel = path.relative(REPO_ROOT, file);
    console.log(`${rel}: ${prev} -> ${next}`);
  }
}

main();
