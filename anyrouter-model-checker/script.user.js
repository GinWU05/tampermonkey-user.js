// ==UserScript==
// @name         AnyRouter Model Checker
// @namespace    https://anyrouter.top/
// @version      0.1.0
// @description  Check AnyRouter model availability from the logged-in browser session.
// @author       Gin WU + Hermes
// @match        https://anyrouter.top/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PRICING_URL = '/api/pricing';
  const OPENAI_BASE_URL = 'https://anyrouter.top/v1';
  const ANTHROPIC_BASE_URL = 'https://anyrouter.top';
  const STORAGE_KEY = 'anyrouter-model-checker-state-v1';

  const DEFAULTS = {
    apiKey: '',
    mode: 'auto',
    only: '',
    limit: 0,
    concurrency: 3,
    timeout: 30,
    intervalMinutes: 0,
    notifyChanges: true,
    filterFailuresOnly: false,
    filterNeeds1mOnly: false,
    collapsed: false,
    results: {},
    lastRunAt: 0,
  };

  const state = {
    ...DEFAULTS,
    ...safeGetValue(STORAGE_KEY, {}),
    models: [],
    running: false,
    stopRequested: false,
    activeCount: 0,
    completedCount: 0,
    statusText: 'idle',
    timerId: null,
    runSeq: 0,
  };

  const els = {};

  function safeGetValue(key, fallback) {
    try {
      const value = GM_getValue(key, fallback);
      return value && typeof value === 'object' ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function persist() {
    const persistable = {
      apiKey: state.apiKey,
      mode: state.mode,
      only: state.only,
      limit: state.limit,
      concurrency: state.concurrency,
      timeout: state.timeout,
      intervalMinutes: state.intervalMinutes,
      notifyChanges: state.notifyChanges,
      filterFailuresOnly: state.filterFailuresOnly,
      filterNeeds1mOnly: state.filterNeeds1mOnly,
      collapsed: state.collapsed,
      results: state.results,
      lastRunAt: state.lastRunAt,
    };
    GM_setValue(STORAGE_KEY, persistable);
  }

  function nowIso(ts = Date.now()) {
    if (!ts) return '-';
    return new Date(ts).toLocaleString();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function parseError(body) {
    if (!body) return '';
    if (typeof body === 'string') return body;
    if (typeof body === 'object') {
      const err = body.error || body.message || body;
      if (typeof err === 'string') return err;
      if (err && typeof err === 'object') {
        return err.message || err.code || JSON.stringify(err);
      }
      return String(err);
    }
    return String(body);
  }

  async function fetchJson(url, options = {}, timeoutSeconds = 30) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    const started = performance.now();

    try {
      const resp = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      const text = await resp.text();
      let body = text;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch (_) {
          body = text;
        }
      }

      return {
        status: resp.status,
        ok: resp.ok,
        body,
        cost: (performance.now() - started) / 1000,
      };
    } catch (err) {
      const aborted = err && err.name === 'AbortError';
      return {
        status: 0,
        ok: false,
        body: aborted ? `timeout after ${timeoutSeconds}s` : String(err && err.message ? err.message : err),
        cost: (performance.now() - started) / 1000,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function looksLikeModelName(x) {
    if (typeof x !== 'string') return false;
    const s = x.trim();
    if (!s) return false;
    const low = s.toLowerCase();

    const bad = new Set([
      'data', 'success', 'message', 'error', 'true', 'false', 'null',
      'default', 'price', 'type', 'group', 'created_at', 'updated_at',
      'input', 'output', 'text', 'image', 'audio', 'cached', 'quota',
    ]);
    if (bad.has(low)) return false;

    const hints = [
      'gpt', 'codex', 'claude', 'gemini', 'deepseek', 'qwen', 'llama',
      'mistral', 'glm', 'kimi', 'moonshot', 'doubao', 'hunyuan',
      'ernie', 'grok', 'yi-', 'o1', 'o3', 'o4', '/', ':',
    ];
    return hints.some((h) => low.includes(h));
  }

  function extractModels(obj) {
    const models = new Set();

    function add(x) {
      if (looksLikeModelName(x)) models.add(x.trim());
    }

    function walk(x) {
      if (Array.isArray(x)) {
        for (const item of x) walk(item);
        return;
      }
      if (x && typeof x === 'object') {
        for (const k of ['model', 'model_name', 'model_id', 'name', 'id']) {
          add(x[k]);
        }
        for (const [k, v] of Object.entries(x)) {
          add(k);
          walk(v);
        }
        return;
      }
      if (typeof x === 'string') add(x);
    }

    walk(obj);
    return [...models].sort((a, b) => a.localeCompare(b));
  }

  async function fetchModels() {
    setStatus('fetching pricing...');
    const resp = await fetchJson(PRICING_URL, { method: 'GET' }, state.timeout);
    if (resp.status !== 200) {
      throw new Error(`pricing 获取失败 HTTP ${resp.status}: ${parseError(resp.body).slice(0, 500)}`);
    }
    const models = extractModels(resp.body);
    if (!models.length) {
      throw new Error('pricing 返回成功，但没有解析到模型名');
    }
    state.models = applyModelFilters(models);
    return state.models;
  }

  function applyModelFilters(models) {
    let out = [...models];
    const only = state.only.trim().toLowerCase();
    if (only) {
      const keywords = only.split(',').map((x) => x.trim()).filter(Boolean);
      out = out.filter((model) => keywords.some((kw) => model.toLowerCase().includes(kw)));
    }
    if (state.limit > 0) out = out.slice(0, state.limit);
    return out;
  }

  function okResponse(apiType, status, body) {
    if (status !== 200 || !body || typeof body !== 'object' || Array.isArray(body)) return false;

    if (apiType === 'responses') {
      return Boolean(body.id) && (body.object === 'response' || 'output' in body || 'output_text' in body);
    }
    if (apiType === 'chat') {
      return Array.isArray(body.choices) && body.choices.length > 0;
    }
    if (apiType === 'anthropic') {
      return Boolean(body.id) && (body.type === 'message' || Array.isArray(body.content));
    }
    return false;
  }

  function chooseTests(mode, model) {
    const low = model.toLowerCase();
    if (mode === 'responses') return ['responses'];
    if (mode === 'anthropic') return ['anthropic'];
    if (mode === 'chat') return ['chat'];
    if (mode === 'all') return ['responses', 'anthropic', 'chat'];
    if (low.includes('claude')) return ['anthropic'];
    if (low.includes('codex')) return ['responses'];
    if (low.includes('gemini')) return ['chat', 'responses'];
    if (low.startsWith('gpt-') || low.startsWith('o1') || low.startsWith('o3') || low.startsWith('o4')) {
      return ['responses', 'chat'];
    }
    return ['chat', 'responses'];
  }

  function classifyResult(result) {
    if (!result) return 'unknown';
    if (result.ok) return result.modelUsed && result.modelUsed !== result.model ? 'available_1m' : 'available';

    const error = String(result.error || '').toLowerCase();
    if (error.includes('1m 上下文') || error.includes('启用 1m') || error.includes('enable 1m')) return 'needs_1m';
    if (error.includes('已下线') || error.includes('下线') || error.includes('offline') || error.includes('deprecated')) return 'offline';
    if (result.status === 402 || error.includes('quota') || error.includes('余额') || error.includes('insufficient') || error.includes('payment')) return 'billing_error';
    if (isApiMismatch(result)) return 'api_mismatch';
    if (result.status === 429 || error.includes('service unavailable') || error.includes('rate limit')) return 'rate_limited';
    return 'unavailable';
  }

  function isApiMismatch(result) {
    if (!result || result.ok) return false;
    const error = String(result.error || '').toLowerCase();
    const api = String(result.api || '').toLowerCase();
    const model = String(result.modelUsed || result.model || '').toLowerCase();

    if (error.includes('当前 api 不支持所选模型')) return true;
    if (error.includes('unsupported model') || error.includes('model not supported') || error.includes('not support the selected model')) return true;
    if (error.includes('invalid model') && (api === 'responses' || api === 'chat')) return true;

    // AnyRouter often reports route mismatch as chat 500 + responses 404.
    // Avoid treating every bare 404 as mismatch; endpoint/network 404 stays unavailable.
    if (result.status === 404 && ['responses', 'chat', 'anthropic'].includes(api)) {
      if (model.includes('gemini') || model.includes('claude') || model.includes('gpt') || model.includes('codex')) {
        return error.includes(model) || error.includes('model') || error.includes('api');
      }
    }
    return false;
  }

  function withModelSuffix(model, suffix) {
    if (!suffix || model.endsWith(suffix)) return model;
    return `${model}${suffix}`;
  }

  function uniq(xs) {
    return [...new Set(xs.filter(Boolean))];
  }

  function oneMillionCandidates(model) {
    const low = model.toLowerCase();
    const out = [];
    if (low.includes('opus')) out.push('opus[1m]');
    if (low.includes('sonnet')) out.push('sonnet[1m]');
    if (low.includes('haiku')) out.push('haiku[1m]');
    out.push(withModelSuffix(model, '[1m]'));
    return uniq(out);
  }

  function mergeAttempts(result, attempts) {
    if (!result) return result;
    result.attempts = attempts.map((x) => ({
      api: x.api,
      modelUsed: x.modelUsed,
      status: x.status,
      ok: x.ok,
      error: x.error,
      statusType: x.statusType,
    }));
    return result;
  }

  function pickBestFailedAttempt(attempts, fallback) {
    const priority = {
      needs_1m: 0,
      rate_limited: 1,
      api_mismatch: 2,
      offline: 3,
      billing_error: 4,
      unavailable: 5,
      unknown: 6,
    };
    return attempts
      .filter((x) => x && x.ok === false)
      .sort((a, b) => (priority[a.statusType] ?? 99) - (priority[b.statusType] ?? 99))[0] || fallback;
  }

  async function runApiTest(api, model, displayModel = model) {
    let result = null;
    if (api === 'responses') result = await testResponses(model);
    if (api === 'chat') result = await testChat(model);
    if (api === 'anthropic') result = await testAnthropic(model);
    if (!result) return null;
    result.model = displayModel;
    result.modelUsed = model;
    result.statusType = classifyResult(result);
    return result;
  }

  async function testResponses(model) {
    const url = `${OPENAI_BASE_URL}/responses`;
    const payload = {
      model,
      input: 'ping',
      max_output_tokens: 1,
    };
    const resp = await fetchJson(url, {
      method: 'POST',
      headers: authHeaders('openai'),
      body: JSON.stringify(payload),
    }, state.timeout);
    const ok = okResponse('responses', resp.status, resp.body);
    return normalizeResult('responses', url, model, ok, resp);
  }

  async function testChat(model) {
    const url = `${OPENAI_BASE_URL}/chat/completions`;
    const payload = {
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      temperature: 0,
      stream: false,
    };
    const resp = await fetchJson(url, {
      method: 'POST',
      headers: authHeaders('openai'),
      body: JSON.stringify(payload),
    }, state.timeout);
    const ok = okResponse('chat', resp.status, resp.body);
    return normalizeResult('chat', url, model, ok, resp);
  }

  async function testAnthropic(model) {
    const url = `${ANTHROPIC_BASE_URL}/v1/messages`;
    const payload = {
      model,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }],
    };
    const resp = await fetchJson(url, {
      method: 'POST',
      headers: authHeaders('anthropic'),
      body: JSON.stringify(payload),
    }, state.timeout);
    const ok = okResponse('anthropic', resp.status, resp.body);
    return normalizeResult('anthropic', url, model, ok, resp);
  }

  function authHeaders(type) {
    const apiKey = state.apiKey.trim();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (type === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }
    return headers;
  }

  function normalizeResult(api, url, model, ok, resp) {
    const result = {
      api,
      url,
      model,
      modelUsed: model,
      ok,
      status: resp.status,
      cost: resp.cost,
      error: ok ? '' : parseError(resp.body).slice(0, 300),
      checkedAt: Date.now(),
    };
    result.statusType = classifyResult(result);
    return result;
  }

  async function checkModel(model) {
    let last = null;
    const attempts = [];
    const tests = chooseTests(state.mode, model);
    for (const api of tests) {
      if (state.stopRequested) break;
      last = await runApiTest(api, model, model);
      if (last) attempts.push(last);
      if (last && last.ok) return mergeAttempts(last, attempts);
      if (last && classifyResult(last) === 'needs_1m') {
        for (const model1m of oneMillionCandidates(model)) {
          if (state.stopRequested) break;
          const retry = await runApiTest(api, model1m, model);
          if (retry) attempts.push(retry);
          if (retry && retry.ok) {
            retry.statusType = 'available_1m';
            retry.error = '';
            return mergeAttempts(retry, attempts);
          }
          if (retry) {
            retry.statusType = classifyResult(retry);
            retry.error = retry.error || `1m retry failed: HTTP ${retry.status}`;
            last = retry;
          }
        }
      }
    }
    last = pickBestFailedAttempt(attempts, last);
    if (last) return mergeAttempts(last, attempts);
    return mergeAttempts({
      api: tests[0] || 'none',
      url: '',
      model,
      modelUsed: model,
      ok: false,
      status: 0,
      cost: 0,
      error: 'no test executed',
      checkedAt: Date.now(),
      statusType: 'unavailable',
    }, attempts);
  }

  async function runQueue(models) {
    let index = 0;
    const concurrency = clampInt(state.concurrency, 1, 10, 3);

    async function worker() {
      while (!state.stopRequested) {
        const i = index;
        index += 1;
        if (i >= models.length) return;

        const model = models[i];
        state.activeCount += 1;
        setStatus(`checking ${state.completedCount}/${models.length}`);
        updateResult(model, {
          model,
          ok: null,
          api: '',
          url: '',
          status: 0,
          cost: 0,
          error: 'checking...',
          checkedAt: Date.now(),
        }, false);

        try {
          const before = state.results[model];
          const result = await checkModel(model);
          updateResult(model, result, true, before);
        } catch (err) {
          updateResult(model, {
            model,
            ok: false,
            api: 'error',
            url: '',
            status: 0,
            cost: 0,
            error: String(err && err.message ? err.message : err).slice(0, 300),
            checkedAt: Date.now(),
          }, true);
        } finally {
          state.activeCount -= 1;
          state.completedCount += 1;
          setStatus(`checking ${state.completedCount}/${models.length}`);
          render();
          persist();
          await sleep(20);
        }
      }
    }

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, models.length); i += 1) workers.push(worker());
    await Promise.all(workers);
  }

  function updateResult(model, result, notify = true, previous = undefined) {
    state.results[model] = result;
    if (notify && state.notifyChanges && previous && typeof previous.ok === 'boolean' && typeof result.ok === 'boolean' && previous.ok !== result.ok) {
      const title = result.ok ? 'AnyRouter 模型恢复可用' : 'AnyRouter 模型不可用';
      const text = `${model}\n${result.api} HTTP ${result.status}${result.error ? `\n${result.error}` : ''}`;
      try {
        GM_notification({ title, text, timeout: 8000 });
      } catch (_) {
        // ignore notification errors
      }
    }
  }

  async function startRun(manual = true) {
    readForm();
    persist();

    if (state.running) {
      setStatus('already running');
      render();
      return;
    }
    if (!state.apiKey.trim()) {
      setStatus('missing API key');
      render();
      alert('请先填写 AnyRouter API Key');
      return;
    }

    state.runSeq += 1;
    state.running = true;
    state.stopRequested = false;
    state.completedCount = 0;
    state.activeCount = 0;
    state.lastRunAt = Date.now();
    setStatus(manual ? 'starting...' : 'scheduled run starting...');
    render();
    persist();

    try {
      const models = await fetchModels();
      if (!models.length) {
        setStatus('no models matched');
        return;
      }
      await runQueue(models);
      setStatus(state.stopRequested ? 'stopped' : 'done');
    } catch (err) {
      setStatus(`error: ${String(err && err.message ? err.message : err).slice(0, 160)}`);
    } finally {
      state.running = false;
      state.activeCount = 0;
      persist();
      render();
      scheduleInterval();
    }
  }

  function stopRun() {
    state.stopRequested = true;
    setStatus('stopping...');
    render();
  }

  function clearResults() {
    if (!confirm('清空当前检测结果？')) return;
    state.results = {};
    state.models = [];
    persist();
    render();
  }

  function exportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      config: {
        mode: state.mode,
        only: state.only,
        limit: state.limit,
        concurrency: state.concurrency,
        timeout: state.timeout,
      },
      results: Object.values(state.results),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anyrouter-model-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copySummary() {
    const text = buildSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      setStatus('summary copied');
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      setStatus(ok ? 'summary copied' : 'copy failed');
    }
    render();
  }

  function buildSummaryText() {
    const results = Object.values(state.results || {});
    const grouped = {
      available: results.filter((r) => r.ok === true),
      needs_1m: results.filter((r) => r.statusType === 'needs_1m'),
      temporary: results.filter((r) => ['rate_limited', 'billing_error'].includes(r.statusType)),
      unavailable: results.filter((r) => r.ok === false && !['needs_1m', 'billing_error', 'rate_limited'].includes(r.statusType)),
      checking: results.filter((r) => r.ok === null),
    };
    const lines = [
      `AnyRouter Checker 摘要 ${nowIso(Date.now())}`,
      `总数: ${state.models.length || results.length || 0}`,
      `可用: ${grouped.available.length}`,
      `需1m: ${grouped.needs_1m.length}`,
      `临时失败: ${grouped.temporary.length}`,
      `不可用: ${grouped.unavailable.length}`,
      `检测中: ${grouped.checking.length + state.activeCount}`,
      '',
    ];

    const append = (title, xs) => {
      if (!xs.length) return;
      lines.push(`${title}:`);
      for (const r of xs) {
        const used = r.modelUsed && r.modelUsed !== r.model ? ` → ${r.modelUsed}` : '';
        const err = r.error ? ` · ${r.error}` : '';
        lines.push(`- ${r.model || ''}${used} · ${r.api || '-'} HTTP ${r.status || 0}${err}`);
      }
      lines.push('');
    };
    append('需1m', grouped.needs_1m);
    append('临时失败', grouped.temporary);
    append('不可用', grouped.unavailable);
    append('可用', grouped.available);
    return lines.join('\n').trim();
  }

  function setStatus(text) {
    state.statusText = text;
  }

  function readForm() {
    if (!els.panel) return;
    state.apiKey = els.apiKey.value.trim();
    state.mode = els.mode.value;
    state.only = els.only.value.trim();
    state.limit = clampInt(els.limit.value, 0, 10000, 0);
    state.concurrency = clampInt(els.concurrency.value, 1, 10, 3);
    state.timeout = clampInt(els.timeout.value, 3, 180, 30);
    state.intervalMinutes = clampInt(els.intervalMinutes.value, 0, 1440, 0);
    state.notifyChanges = els.notifyChanges.checked;
    state.filterFailuresOnly = Boolean(els.filterFailuresOnly && els.filterFailuresOnly.checked);
    state.filterNeeds1mOnly = Boolean(els.filterNeeds1mOnly && els.filterNeeds1mOnly.checked);
  }

  function scheduleInterval() {
    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }
    if (state.intervalMinutes > 0 && !state.running) {
      state.timerId = setTimeout(() => startRun(false), state.intervalMinutes * 60 * 1000);
    }
  }

  function createPanel() {
    if (document.getElementById('anyrouter-checker-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      #anyrouter-checker-panel {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        width: 420px;
        max-height: calc(100vh - 32px);
        background: #101318;
        color: #e8eef8;
        border: 1px solid #2f3745;
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0,0,0,.45);
        font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #anyrouter-checker-panel.arc-has-results { top: 16px; }
      #anyrouter-checker-panel * { box-sizing: border-box; }
      #anyrouter-checker-panel .arc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px;
        background: #161b23;
        border-bottom: 1px solid #2f3745;
      }
      #anyrouter-checker-panel .arc-title { font-weight: 700; font-size: 14px; }
      #anyrouter-checker-panel .arc-body {
        padding: 12px;
        overflow: visible;
      }
      #anyrouter-checker-panel.arc-has-results .arc-body {
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #anyrouter-checker-panel.arc-collapsed { top: auto; width: 320px; height: auto; max-height: none; }
      #anyrouter-checker-panel.arc-collapsed .arc-body { display: none; }
      #anyrouter-checker-panel input,
      #anyrouter-checker-panel select {
        width: 100%;
        padding: 7px 8px;
        color: #e8eef8;
        background: #0b0e13;
        border: 1px solid #303948;
        border-radius: 8px;
        outline: none;
      }
      #anyrouter-checker-panel input:focus,
      #anyrouter-checker-panel select:focus { border-color: #5da7ff; }
      #anyrouter-checker-panel label { display: block; margin: 0 0 4px; color: #aeb8c8; font-size: 12px; }
      #anyrouter-checker-panel .arc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      #anyrouter-checker-panel .arc-field { margin-bottom: 8px; }
      #anyrouter-checker-panel .arc-actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
      #anyrouter-checker-panel button {
        padding: 7px 10px;
        color: #e8eef8;
        background: #222a36;
        border: 1px solid #3a4555;
        border-radius: 8px;
        cursor: pointer;
      }
      #anyrouter-checker-panel button:hover { background: #2d3746; }
      #anyrouter-checker-panel button.arc-primary { background: #1f6feb; border-color: #388bfd; }
      #anyrouter-checker-panel button.arc-danger { background: #5c1f25; border-color: #8a3039; }
      #anyrouter-checker-panel .arc-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 10px 0;
      }
      #anyrouter-checker-panel .arc-stat {
        padding: 8px;
        background: #0b0e13;
        border: 1px solid #293241;
        border-radius: 8px;
      }
      #anyrouter-checker-panel .arc-stat b { display: block; font-size: 16px; }
      #anyrouter-checker-panel .arc-muted { color: #9aa7b8; font-size: 12px; }
      #anyrouter-checker-panel .arc-status { color: #cbd5e1; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #anyrouter-checker-panel .arc-results {
        margin-top: 10px;
        overflow: visible;
        border: 1px solid #293241;
        border-radius: 8px;
      }
      #anyrouter-checker-panel.arc-has-results .arc-results {
        min-height: 0;
        flex: 1;
        overflow: auto;
      }
      #anyrouter-checker-panel .arc-row {
        padding: 8px;
        border-bottom: 1px solid #242c38;
      }
      #anyrouter-checker-panel .arc-row:last-child { border-bottom: 0; }
      #anyrouter-checker-panel .arc-model { font-weight: 650; word-break: break-all; }
      #anyrouter-checker-panel .arc-ok { color: #3fb950; }
      #anyrouter-checker-panel .arc-bad { color: #ff7b72; }
      #anyrouter-checker-panel .arc-checking { color: #d29922; }
      #anyrouter-checker-panel .arc-warn { color: #d29922; }
      #anyrouter-checker-panel .arc-temp { color: #f0883e; }
      #anyrouter-checker-panel .arc-error { color: #c9d1d9; word-break: break-word; }
      #anyrouter-checker-panel details.arc-attempts { margin-top: 4px; }
      #anyrouter-checker-panel details.arc-attempts summary { cursor: pointer; }
      #anyrouter-checker-panel .arc-checkline { display: flex; gap: 6px; align-items: center; }
      #anyrouter-checker-panel .arc-checkline input { width: auto; }
    `;
    document.documentElement.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'anyrouter-checker-panel';
    panel.innerHTML = `
      <div class="arc-header">
        <div>
          <div class="arc-title">AnyRouter Checker</div>
          <div class="arc-status" data-el="status"></div>
        </div>
        <button type="button" data-action="toggle">折叠</button>
      </div>
      <div class="arc-body">
        <div class="arc-field">
          <label>API Key</label>
          <input data-el="apiKey" type="password" placeholder="sk-..." autocomplete="off" />
        </div>
        <div class="arc-grid">
          <div class="arc-field">
            <label>mode</label>
            <select data-el="mode">
              <option value="auto">auto</option>
              <option value="responses">responses</option>
              <option value="anthropic">anthropic</option>
              <option value="chat">chat</option>
              <option value="all">all</option>
            </select>
          </div>
          <div class="arc-field">
            <label>only，逗号分隔</label>
            <input data-el="only" placeholder="claude,codex" />
          </div>
          <div class="arc-field">
            <label>limit，0=不限</label>
            <input data-el="limit" type="number" min="0" step="1" />
          </div>
          <div class="arc-field">
            <label>concurrency</label>
            <input data-el="concurrency" type="number" min="1" max="10" step="1" />
          </div>
          <div class="arc-field">
            <label>timeout 秒</label>
            <input data-el="timeout" type="number" min="3" max="180" step="1" />
          </div>
          <div class="arc-field">
            <label>interval 分钟，0=关闭</label>
            <input data-el="intervalMinutes" type="number" min="0" max="1440" step="1" />
          </div>
        </div>
        <label class="arc-checkline">
          <input data-el="notifyChanges" type="checkbox" />
          <span>模型状态变化时浏览器通知</span>
        </label>
        <label class="arc-checkline">
          <input data-el="filterFailuresOnly" type="checkbox" />
          <span>只看失败/需1m</span>
        </label>
        <label class="arc-checkline">
          <input data-el="filterNeeds1mOnly" type="checkbox" />
          <span>只看需1m</span>
        </label>
        <div class="arc-actions">
          <button class="arc-primary" type="button" data-action="start">开始</button>
          <button class="arc-danger" type="button" data-action="stop">停止</button>
          <button type="button" data-action="save">保存配置</button>
          <button type="button" data-action="clear">清空结果</button>
          <button type="button" data-action="export">导出 JSON</button>
          <button type="button" data-action="copySummary">复制摘要</button>
        </div>
        <div class="arc-muted" data-el="lastRun"></div>
        <div class="arc-stats">
          <div class="arc-stat"><span class="arc-muted">总数</span><b data-el="statTotal">0</b></div>
          <div class="arc-stat"><span class="arc-muted">可用</span><b class="arc-ok" data-el="statOk">0</b></div>
          <div class="arc-stat"><span class="arc-muted">需1m</span><b class="arc-warn" data-el="statNeeds1m">0</b></div>
          <div class="arc-stat"><span class="arc-muted">临时失败</span><b class="arc-temp" data-el="statTemporary">0</b></div>
          <div class="arc-stat"><span class="arc-muted">不可用</span><b class="arc-bad" data-el="statBad">0</b></div>
          <div class="arc-stat"><span class="arc-muted">检测中</span><b class="arc-checking" data-el="statChecking">0</b></div>
        </div>
        <div class="arc-results" data-el="results"></div>
      </div>
    `;
    document.body.appendChild(panel);

    els.panel = panel;
    for (const node of panel.querySelectorAll('[data-el]')) {
      els[node.dataset.el] = node;
    }

    panel.addEventListener('click', (event) => {
      const action = event.target && event.target.dataset ? event.target.dataset.action : '';
      if (!action) return;
      if (action === 'toggle') {
        state.collapsed = !state.collapsed;
        persist();
        render();
      }
      if (action === 'start') startRun(true);
      if (action === 'stop') stopRun();
      if (action === 'save') {
        readForm();
        persist();
        setStatus('config saved');
        scheduleInterval();
        render();
      }
      if (action === 'clear') clearResults();
      if (action === 'export') exportJson();
      if (action === 'copySummary') copySummary();
    });

    for (const key of ['apiKey', 'mode', 'only', 'limit', 'concurrency', 'timeout', 'intervalMinutes', 'notifyChanges', 'filterFailuresOnly', 'filterNeeds1mOnly']) {
      els[key].addEventListener('change', () => {
        readForm();
        persist();
        scheduleInterval();
        render();
      });
    }

    fillForm();
    render();
    scheduleInterval();
  }

  function fillForm() {
    els.apiKey.value = state.apiKey || '';
    els.mode.value = state.mode || 'auto';
    els.only.value = state.only || '';
    els.limit.value = String(state.limit || 0);
    els.concurrency.value = String(state.concurrency || 3);
    els.timeout.value = String(state.timeout || 30);
    els.intervalMinutes.value = String(state.intervalMinutes || 0);
    els.notifyChanges.checked = Boolean(state.notifyChanges);
    els.filterFailuresOnly.checked = Boolean(state.filterFailuresOnly);
    els.filterNeeds1mOnly.checked = Boolean(state.filterNeeds1mOnly);
  }

  function render() {
    if (!els.panel) return;

    els.panel.classList.toggle('arc-collapsed', Boolean(state.collapsed));
    const results = Object.values(state.results || {});
    const hasResults = results.length > 0;
    els.panel.classList.toggle('arc-has-results', hasResults && !state.collapsed);
    const toggleBtn = els.panel.querySelector('[data-action="toggle"]');
    if (toggleBtn) toggleBtn.textContent = state.collapsed ? '展开' : '折叠';

    els.status.textContent = state.statusText || 'idle';
    els.lastRun.textContent = `Last run: ${nowIso(state.lastRunAt)}${state.intervalMinutes > 0 ? ` · interval ${state.intervalMinutes}m` : ''}`;

    const ok = results.filter((r) => r.ok === true).length;
    const needs1m = results.filter((r) => r.statusType === 'needs_1m').length;
    const temporary = results.filter((r) => ['rate_limited', 'billing_error'].includes(r.statusType)).length;
    const bad = results.filter((r) => r.ok === false && !['needs_1m', 'billing_error', 'rate_limited'].includes(r.statusType)).length;
    const checking = results.filter((r) => r.ok === null).length;

    els.statTotal.textContent = String(state.models.length || results.length || 0);
    els.statOk.textContent = String(ok);
    els.statNeeds1m.textContent = String(needs1m);
    els.statTemporary.textContent = String(temporary);
    els.statBad.textContent = String(bad);
    els.statChecking.textContent = String(checking + state.activeCount);

    const visibleResults = results.filter((r) => {
      if (state.filterNeeds1mOnly) return r.statusType === 'needs_1m';
      if (state.filterFailuresOnly) return r.ok === false || r.statusType === 'needs_1m';
      return true;
    });

    const sorted = visibleResults.sort((a, b) => {
      const rank = (x) => (x.ok === null ? 0 : x.ok ? 2 : 1);
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return String(a.model).localeCompare(String(b.model));
    });

    els.results.innerHTML = sorted.slice(0, 300).map((r) => renderResultRow(r)).join('') || '<div class="arc-row arc-muted">暂无结果</div>';
  }

  function renderResultRow(r) {
    const labels = {
      available: '可用',
      available_1m: '可用·1m',
      needs_1m: '需1m',
      offline: '已下线',
      billing_error: '计费异常',
      api_mismatch: '接口不匹配',
      rate_limited: '限流',
      unavailable: '不可用',
    };
    const cls = r.ok === null
      ? 'arc-checking'
      : r.ok
        ? 'arc-ok'
        : r.statusType === 'needs_1m'
          ? 'arc-warn'
          : ['rate_limited', 'billing_error'].includes(r.statusType)
            ? 'arc-temp'
            : 'arc-bad';
    const label = r.ok === null ? '检测中' : (labels[r.statusType] || (r.ok ? '可用' : '不可用'));
    const modelUsed = r.modelUsed && r.modelUsed !== r.model ? ` → ${escapeHtml(r.modelUsed)}` : '';
    const attempts = Array.isArray(r.attempts) && r.attempts.length > 1
      ? `<details class="arc-attempts arc-muted"><summary>attempts ${r.attempts.length}</summary><div>${r.attempts.map((x) => `${escapeHtml(x.api || '-')} ${escapeHtml(x.modelUsed || '-')} → HTTP ${escapeHtml(String(x.status || 0))}${x.ok ? ' OK' : ''}`).join(' / ')}</div></details>`
      : '';
    const error = r.error ? `<div class="arc-error">${escapeHtml(r.error)}</div>` : '';
    return `
      <div class="arc-row">
        <div class="arc-model ${cls}">[${label}] ${escapeHtml(r.model || '')}${modelUsed}</div>
        <div class="arc-muted">api=${escapeHtml(r.api || '-')} · HTTP ${escapeHtml(String(r.status || 0))} · ${Number(r.cost || 0).toFixed(2)}s · ${escapeHtml(nowIso(r.checkedAt))}</div>
        ${attempts}
        ${error}
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function boot() {
    if (!document.body) {
      setTimeout(boot, 200);
      return;
    }
    createPanel();
    setStatus('ready');
    render();
  }

  boot();
})();
