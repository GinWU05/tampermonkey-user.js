#!/usr/bin/env node
// Validates the ==UserScript== header of every <dir>/script.user.js and
// <dir>/dev.user.js against the repository metadata convention.
// Zero dependencies. Run with `npm test`.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_URL = 'https://github.com/screw-hand/tampermonkey-user.js';

const AUTHOR = 'GinWU';
const NAMESPACE = 'https://screw-hand.com/';
const LICENSE = 'MIT';
const SUPPORT_URL = `${REPO_URL}/issues`;
const HOMEPAGE_PREFIX = `${REPO_URL}/tree/main/`;
const DEV_REQUIRE_PREFIX = 'http://localhost:3000/';
const DEV_VERSION = '0.0.0';
const GREASYFORK_UPDATE_RE = /^https:\/\/update\.greasyfork\.org\/scripts\/(\d+)\/script\.(user|meta)\.js$/;

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const CJK_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/;

const EXCLUDED_DIRS = new Set(['node_modules', '_utils', 'docs', '.git', '.github', '.hermes']);

const SCRIPT_REQUIRED_KEYS = [
  'name',
  'name:zh-CN',
  'namespace',
  'version',
  'description',
  'description:zh-CN',
  'author',
  'license',
  'homepageURL',
  'supportURL',
  'match',
  'grant',
];

// Legacy keys that the template replaces. Their presence is an error.
const LEGACY_KEYS = {
  homepage: '@homepageURL',
  'name:en': '@name + @name:zh-CN',
  'description:en': '@description + @description:zh-CN',
};

// Relative order of known keys in script.user.js. Keys not listed here
// (e.g. @require, @connect, @noframes) must sit after the last @grant and
// before @downloadURL.
const SCRIPT_KEY_ORDER = [
  'name',
  'name:zh-CN',
  'namespace',
  'version',
  'description',
  'description:zh-CN',
  'author',
  'contributor',
  'license',
  'homepageURL',
  'supportURL',
  'icon',
  'match',
  'run-at',
  'grant',
  'downloadURL',
  'updateURL',
];

function parseHeader(source) {
  const start = source.indexOf('// ==UserScript==');
  const end = source.indexOf('// ==/UserScript==');
  if (start === -1 || end === -1 || end < start) return null;

  const entries = [];
  const lines = source.slice(start, end).split('\n').slice(1);
  for (const line of lines) {
    const match = /^\/\/\s*@(\S+)(?:\s+(.*?))?\s*$/.exec(line);
    if (!match) continue;
    entries.push({ key: match[1], value: match[2] ?? '' });
  }
  return entries;
}

function valuesOf(entries, key) {
  return entries.filter((entry) => entry.key === key).map((entry) => entry.value);
}

function firstOf(entries, key) {
  return valuesOf(entries, key)[0];
}

function checkOrder(entries, order, report) {
  const rank = new Map(order.map((key, index) => [key, index]));
  let lastRank = -1;
  let lastKey = null;
  for (const { key } of entries) {
    if (!rank.has(key)) continue;
    const current = rank.get(key);
    if (current < lastRank) {
      report(`@${key} must come before @${lastKey} (template order)`);
    } else {
      lastRank = current;
      lastKey = key;
    }
  }

  // Unlisted keys must sit after the last @grant and before @downloadURL.
  // Legacy keys are already reported by checkLegacyKeys.
  const keys = entries.map((entry) => entry.key);
  const lastGrant = keys.lastIndexOf('grant');
  const firstDownload = keys.indexOf('downloadURL');
  keys.forEach((key, index) => {
    if (rank.has(key) || key in LEGACY_KEYS) return;
    const afterGrant = lastGrant === -1 || index > lastGrant;
    const beforeDownload = firstDownload === -1 || index < firstDownload;
    if (!afterGrant || !beforeDownload) {
      report(`@${key} must come after @grant and before @downloadURL (template order)`);
    }
  });
}

function checkLegacyKeys(entries, report) {
  for (const [key, replacement] of Object.entries(LEGACY_KEYS)) {
    if (valuesOf(entries, key).length > 0) report(`@${key} is a legacy key; use ${replacement}`);
  }
}

function checkScript(dir, entries, report) {
  for (const key of SCRIPT_REQUIRED_KEYS) {
    if (valuesOf(entries, key).length === 0) report(`missing @${key}`);
  }

  const exact = {
    author: AUTHOR,
    namespace: NAMESPACE,
    license: LICENSE,
    supportURL: SUPPORT_URL,
    homepageURL: `${HOMEPAGE_PREFIX}${dir}`,
  };
  for (const [key, expected] of Object.entries(exact)) {
    const actual = firstOf(entries, key);
    if (actual !== undefined && actual !== expected) {
      report(`@${key} must be "${expected}", got "${actual}"`);
    }
  }

  const version = firstOf(entries, 'version');
  if (version !== undefined && !SEMVER_RE.test(version)) {
    report(`@version must be strict semver x.y.z, got "${version}"`);
  }

  const name = firstOf(entries, 'name');
  if (name !== undefined && CJK_RE.test(name)) {
    report(`@name must not contain CJK characters, got "${name}"`);
  }
  const nameZh = firstOf(entries, 'name:zh-CN');
  if (nameZh !== undefined && !CJK_RE.test(nameZh)) {
    report(`@name:zh-CN must contain CJK characters, got "${nameZh}"`);
  }

  for (const key of ['description', 'description:zh-CN']) {
    const value = firstOf(entries, key);
    if (value !== undefined && value.trim() === '') report(`@${key} must not be empty`);
  }

  for (const key of ['match', 'grant']) {
    if (valuesOf(entries, key).some((value) => value.trim() === '')) {
      report(`@${key} must not have an empty value`);
    }
  }

  checkLegacyKeys(entries, report);
  checkOrder(entries, SCRIPT_KEY_ORDER, report);

  const downloadURL = firstOf(entries, 'downloadURL');
  const updateURL = firstOf(entries, 'updateURL');
  if ((downloadURL === undefined) !== (updateURL === undefined)) {
    report('@downloadURL and @updateURL must be set together');
  }
  const downloadMatch = downloadURL === undefined ? null : GREASYFORK_UPDATE_RE.exec(downloadURL);
  const updateMatch = updateURL === undefined ? null : GREASYFORK_UPDATE_RE.exec(updateURL);
  if (downloadURL !== undefined && (!downloadMatch || downloadMatch[2] !== 'user')) {
    report(`@downloadURL must be https://update.greasyfork.org/scripts/<id>/script.user.js, got "${downloadURL}"`);
  }
  if (updateURL !== undefined && (!updateMatch || updateMatch[2] !== 'meta')) {
    report(`@updateURL must be https://update.greasyfork.org/scripts/<id>/script.meta.js, got "${updateURL}"`);
  }
  if (downloadMatch && updateMatch && downloadMatch[1] !== updateMatch[1]) {
    report(`@downloadURL id ${downloadMatch[1]} does not match @updateURL id ${updateMatch[1]}`);
  }
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function checkDev(dir, entries, scriptEntries, report) {
  const name = firstOf(entries, 'name');
  if (name === undefined) report('missing @name');
  else if (!name.startsWith('DEV ')) report(`@name must start with "DEV ", got "${name}"`);

  const exact = { author: AUTHOR, namespace: NAMESPACE, license: LICENSE, version: DEV_VERSION };
  for (const [key, expected] of Object.entries(exact)) {
    const actual = firstOf(entries, key);
    if (actual === undefined) report(`missing @${key}`);
    else if (actual !== expected) report(`@${key} must be "${expected}", got "${actual}"`);
  }

  const expectedRequire = `${DEV_REQUIRE_PREFIX}${dir}/script.user.js`;
  const requires = valuesOf(entries, 'require');
  if (requires.length === 0) report('missing @require');
  else if (requires.length !== 1 || requires[0] !== expectedRequire) {
    report(`@require must be exactly one line "${expectedRequire}", got "${requires.join('", "')}"`);
  }

  if (!scriptEntries) {
    report('cannot mirror script.user.js: its header is missing or unparsable');
    return;
  }

  const devMatches = sortedUnique(valuesOf(entries, 'match'));
  const scriptMatches = sortedUnique(valuesOf(scriptEntries, 'match'));
  if (devMatches.join('\n') !== scriptMatches.join('\n')) {
    report(`@match must mirror script.user.js: expected [${scriptMatches.join(', ')}], got [${devMatches.join(', ')}]`);
  }

  const devRunAt = firstOf(entries, 'run-at');
  const scriptRunAt = firstOf(scriptEntries, 'run-at');
  if (devRunAt !== scriptRunAt) {
    report(`@run-at must mirror script.user.js: expected ${scriptRunAt === undefined ? 'none' : `"${scriptRunAt}"`}, got ${devRunAt === undefined ? 'none' : `"${devRunAt}"`}`);
  }

  const devGrants = new Set(valuesOf(entries, 'grant'));
  const scriptGrants = valuesOf(scriptEntries, 'grant').filter((grant) => grant !== 'none');
  if (devGrants.size === 0) report('missing @grant');
  const missingGrants = scriptGrants.filter((grant) => !devGrants.has(grant));
  if (missingGrants.length > 0) {
    report(`@grant must include every grant of script.user.js; missing ${missingGrants.map((grant) => `"${grant}"`).join(', ')}`);
  }
}

// Returns one entry per script directory: { dir, script, dev } where script/dev
// are absolute paths or null. Directories holding *.user.js under another name
// but no script.user.js are reported as problems.
function collectTargets(report) {
  const targets = [];
  const dirs = readdirSync(REPO_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !EXCLUDED_DIRS.has(entry.name) && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
  for (const dir of dirs) {
    const scriptPath = join(REPO_ROOT, dir, 'script.user.js');
    const devPath = join(REPO_ROOT, dir, 'dev.user.js');
    const hasScript = existsSync(scriptPath);
    const hasUserJs = readdirSync(join(REPO_ROOT, dir)).some((file) => file.endsWith('.user.js'));
    if (!hasScript) {
      if (hasUserJs) report(`${dir}: contains *.user.js but no script.user.js`);
      continue;
    }
    targets.push({ dir, script: scriptPath, dev: existsSync(devPath) ? devPath : null });
  }
  return targets;
}

const problems = [];
const summaries = [];
let checkedFiles = 0;

function summarize(relative, entries) {
  checkedFiles += 1;
  summaries.push(`${relative.padEnd(46)} ${firstOf(entries, 'name') ?? '?'} @ ${firstOf(entries, 'version') ?? '?'}`);
}

const targets = collectTargets((message) => problems.push(message));

for (const { dir, script, dev } of targets) {
  const scriptRelative = `${dir}/script.user.js`;
  const reportScript = (message) => problems.push(`${scriptRelative}: ${message}`);
  const scriptEntries = parseHeader(readFileSync(script, 'utf8'));
  if (!scriptEntries) reportScript('missing ==UserScript== header block');
  else {
    checkScript(dir, scriptEntries, reportScript);
    summarize(scriptRelative, scriptEntries);
  }

  if (!dev) continue;
  const devRelative = `${dir}/dev.user.js`;
  const reportDev = (message) => problems.push(`${devRelative}: ${message}`);
  const devEntries = parseHeader(readFileSync(dev, 'utf8'));
  if (!devEntries) reportDev('missing ==UserScript== header block');
  else {
    checkDev(dir, devEntries, scriptEntries, reportDev);
    summarize(devRelative, devEntries);
  }
}

if (targets.length === 0) problems.push('no <dir>/script.user.js found under the repository root');

if (problems.length > 0) {
  console.error(`Metadata check failed with ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Metadata check passed for ${checkedFiles} file(s):\n`);
  for (const summary of summaries) console.log(`  ${summary}`);
}
