/**
 * APIForge — API Testing & Debugging Tool
 * Core Architecture & Application Logic
 */

(function () {
  'use strict';

  // =========================================================================
  // CONSTANTS & INITIAL STORAGE KEYS
  // =========================================================================
  const STORAGE_KEYS = {
    THEME: 'apiforge_theme',
    HISTORY: 'apiforge_history',
    COLLECTIONS: 'apiforge_collections',
    ENV_VARS: 'apiforge_env_vars',
    SETTINGS: 'apiforge_settings',
    LAST_REQUEST: 'apiforge_last_request',
    PROXY_ENABLED: 'apiforge_cors_proxy_enabled'
  };

  const DEFAULT_SETTINGS = {
    timeoutSeconds: 15,
    corsProxyUrl: 'https://corsproxy.io/?'
  };

  const DEFAULT_COLLECTIONS = [
    {
      id: 'col-jsonplaceholder',
      name: 'JSONPlaceholder API',
      requests: [
        {
          id: 'req-get-posts',
          name: 'Get All Posts',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/posts?_limit=5',
          params: [{ enabled: true, key: '_limit', value: '5', desc: 'limit posts' }],
          headers: [{ enabled: true, key: 'Accept', value: 'application/json', desc: '' }],
          bodyType: 'none',
          bodyJson: '',
          bodyRaw: '',
          auth: { type: 'none' }
        },
        {
          id: 'req-post-create',
          name: 'Create Post',
          method: 'POST',
          url: 'https://jsonplaceholder.typicode.com/posts',
          params: [],
          headers: [
            { enabled: true, key: 'Content-Type', value: 'application/json; charset=UTF-8', desc: '' },
            { enabled: true, key: 'Accept', value: 'application/json', desc: '' }
          ],
          bodyType: 'json',
          bodyJson: JSON.stringify({ title: 'New Article', body: 'Exploring APIForge client.', userId: 1 }, null, 2),
          bodyRaw: '',
          auth: { type: 'none' }
        }
      ]
    }
  ];

  const SAMPLE_PRESETS = {
    'get-posts': {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts?_limit=5',
      params: [{ enabled: true, key: '_limit', value: '5', desc: 'limit results' }],
      headers: [{ enabled: true, key: 'Accept', value: 'application/json', desc: '' }],
      bodyType: 'none',
      bodyJson: '',
      auth: { type: 'none' }
    },
    'get-single-post': {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [],
      headers: [{ enabled: true, key: 'Accept', value: 'application/json', desc: '' }],
      bodyType: 'none',
      bodyJson: '',
      auth: { type: 'none' }
    },
    'post-create': {
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      params: [],
      headers: [
        { enabled: true, key: 'Content-Type', value: 'application/json; charset=UTF-8', desc: '' }
      ],
      bodyType: 'json',
      bodyJson: JSON.stringify({
        title: 'Building Modern Web Tools',
        body: 'APIForge delivers instant HTTP testing with developer-first UI.',
        userId: 42
      }, null, 2),
      auth: { type: 'none' }
    },
    'put-update': {
      method: 'PUT',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [],
      headers: [
        { enabled: true, key: 'Content-Type', value: 'application/json; charset=UTF-8', desc: '' }
      ],
      bodyType: 'json',
      bodyJson: JSON.stringify({
        id: 1,
        title: 'Updated Title via APIForge',
        body: 'Updated body content.',
        userId: 1
      }, null, 2),
      auth: { type: 'none' }
    },
    'delete-post': {
      method: 'DELETE',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [],
      headers: [],
      bodyType: 'none',
      bodyJson: '',
      auth: { type: 'none' }
    },
    'get-httpbin-headers': {
      method: 'GET',
      url: 'https://httpbin.org/headers',
      params: [],
      headers: [
        { enabled: true, key: 'Custom-Forge-Header', value: 'APIForge-v1.0', desc: 'Demo inspection' }
      ],
      bodyType: 'none',
      bodyJson: '',
      auth: { type: 'none' }
    },
    'get-dummyjson-products': {
      method: 'GET',
      url: 'https://dummyjson.com/products?limit=3',
      params: [{ enabled: true, key: 'limit', value: '3', desc: 'max items' }],
      headers: [{ enabled: true, key: 'Accept', value: 'application/json', desc: '' }],
      bodyType: 'none',
      bodyJson: '',
      auth: { type: 'none' }
    },
    'get-ip': {
      method: 'GET',
      url: 'https://api.ipify.org?format=json',
      params: [{ enabled: true, key: 'format', value: 'json', desc: '' }],
      headers: [{ enabled: true, key: 'Accept', value: 'application/json', desc: '' }],
      bodyType: 'none',
      bodyJson: '',
      auth: { type: 'none' }
    }
  };

  // =========================================================================
  // APPLICATION STATE
  // =========================================================================
  const state = {
    theme: 'dark',
    activeAbortController: null,
    isRequestInProgress: false,
    requestStartTime: 0,
    elapsedInterval: null,
    lastResponse: null,
    corsProxyActive: false,
    settings: { ...DEFAULT_SETTINGS },
    envVars: [],
    history: [],
    collections: [],
    activeTab: 'params',
    activeResTab: 'body',
    codeModalLang: 'curl',
    isSyncingUrl: false
  };

  // =========================================================================
  // DOM ELEMENT REFERENCES
  // =========================================================================
  const DOM = {
    // Top Toolbar
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    sidebar: document.getElementById('sidebar'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),
    samplePresetsSelect: document.getElementById('samplePresetsSelect'),
    envBtn: document.getElementById('envBtn'),
    activeEnvBadge: document.getElementById('activeEnvBadge'),
    codeSnippetBtn: document.getElementById('codeSnippetBtn'),
    proxyToggleBtn: document.getElementById('proxyToggleBtn'),
    proxyStatusText: document.getElementById('proxyStatusText'),
    settingsBtn: document.getElementById('settingsBtn'),

    // Sidebar
    tabBtnHistory: document.getElementById('tabBtnHistory'),
    tabBtnCollections: document.getElementById('tabBtnCollections'),
    panelHistory: document.getElementById('panelHistory'),
    panelCollections: document.getElementById('panelCollections'),
    historySearchInput: document.getElementById('historySearchInput'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    historyList: document.getElementById('historyList'),
    newCollectionBtn: document.getElementById('newCollectionBtn'),
    exportCollectionsBtn: document.getElementById('exportCollectionsBtn'),
    importCollectionsBtn: document.getElementById('importCollectionsBtn'),
    collectionFileInput: document.getElementById('collectionFileInput'),
    collectionsList: document.getElementById('collectionsList'),

    // Request Bar
    httpMethodSelect: document.getElementById('httpMethodSelect'),
    requestUrlInput: document.getElementById('requestUrlInput'),
    urlFeedback: document.getElementById('urlFeedback'),
    sendBtn: document.getElementById('sendBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    saveRequestBtn: document.getElementById('saveRequestBtn'),

    // Request Config Tabs
    paneTabs: document.querySelectorAll('.pane-tab[data-tab]'),
    tabPanels: {
      params: document.getElementById('tabParams'),
      headers: document.getElementById('tabHeaders'),
      body: document.getElementById('tabBody'),
      auth: document.getElementById('tabAuth')
    },
    paramsCountBadge: document.getElementById('paramsCountBadge'),
    headersCountBadge: document.getElementById('headersCountBadge'),
    bodyIndicator: document.getElementById('bodyIndicator'),
    authIndicator: document.getElementById('authIndicator'),

    // Params Table
    addParamBtn: document.getElementById('addParamBtn'),
    paramsTableBody: document.getElementById('paramsTableBody'),

    // Headers Table
    addHeaderBtn: document.getElementById('addHeaderBtn'),
    headersTableBody: document.getElementById('headersTableBody'),
    quickHeaderSelect: document.getElementById('quickHeaderSelect'),

    // Body Panel
    bodyTypeRadios: document.querySelectorAll('input[name="bodyType"]'),
    bodySubpanels: {
      none: document.getElementById('bodyTypeNone'),
      json: document.getElementById('bodyTypeJson'),
      'form-data': document.getElementById('bodyTypeForm'),
      'x-www-form-urlencoded': document.getElementById('bodyTypeForm'),
      raw: document.getElementById('bodyTypeRaw')
    },
    jsonBodyTextarea: document.getElementById('jsonBodyTextarea'),
    rawBodyTextarea: document.getElementById('rawBodyTextarea'),
    formatJsonBtn: document.getElementById('formatJsonBtn'),
    minifyJsonBtn: document.getElementById('minifyJsonBtn'),
    clearBodyBtn: document.getElementById('clearBodyBtn'),
    jsonValidationStatus: document.getElementById('jsonValidationStatus'),
    formDataTableBody: document.getElementById('formDataTableBody'),
    addFormDataRowBtn: document.getElementById('addFormDataRowBtn'),

    // Auth Panel
    authTypeSelect: document.getElementById('authTypeSelect'),
    authSubpanels: {
      none: document.getElementById('authConfigNone'),
      bearer: document.getElementById('authConfigBearer'),
      basic: document.getElementById('authConfigBasic'),
      apikey: document.getElementById('authConfigApiKey')
    },
    bearerTokenInput: document.getElementById('bearerTokenInput'),
    basicUsernameInput: document.getElementById('basicUsernameInput'),
    basicPasswordInput: document.getElementById('basicPasswordInput'),
    apiKeyNameInput: document.getElementById('apiKeyNameInput'),
    apiKeyValueInput: document.getElementById('apiKeyValueInput'),
    apiKeyLocationSelect: document.getElementById('apiKeyLocationSelect'),

    // Response Inspector
    resTabs: document.querySelectorAll('.pane-tab[data-res-tab]'),
    resSubpanels: {
      body: document.getElementById('resTabBody'),
      headers: document.getElementById('resTabHeaders'),
      preview: document.getElementById('resTabPreview'),
      timing: document.getElementById('resTabTiming')
    },
    responseMetrics: document.getElementById('responseMetrics'),
    resStatusPill: document.getElementById('resStatusPill'),
    resStatusText: document.getElementById('resStatusText'),
    resTimeText: document.getElementById('resTimeText'),
    resSizeText: document.getElementById('resSizeText'),
    resHeadersBadge: document.getElementById('resHeadersBadge'),

    responseLoadingOverlay: document.getElementById('responseLoadingOverlay'),
    elapsedTimer: document.getElementById('elapsedTimer'),
    responseEmptyState: document.getElementById('responseEmptyState'),
    responseErrorState: document.getElementById('responseErrorState'),
    errorTitle: document.getElementById('errorTitle'),
    errorMessage: document.getElementById('errorMessage'),
    enableProxyAndRetryBtn: document.getElementById('enableProxyAndRetryBtn'),
    loadSafeSampleBtn: document.getElementById('loadSafeSampleBtn'),

    resFormatPrettyBtn: document.getElementById('resFormatPrettyBtn'),
    resFormatRawBtn: document.getElementById('resFormatRawBtn'),
    responseSearchInput: document.getElementById('responseSearchInput'),
    copyResponseBtn: document.getElementById('copyResponseBtn'),
    downloadResponseBtn: document.getElementById('downloadResponseBtn'),
    responsePrettyViewer: document.getElementById('responsePrettyViewer'),
    responseRawViewer: document.getElementById('responseRawViewer'),
    responseHeadersTableBody: document.getElementById('responseHeadersTableBody'),
    copyHeadersBtn: document.getElementById('copyHeadersBtn'),
    previewIframe: document.getElementById('previewIframe'),
    previewFallback: document.getElementById('previewFallback'),

    // Response Stats Cards
    statsStatusCode: document.getElementById('statsStatusCode'),
    statsTime: document.getElementById('statsTime'),
    statsSize: document.getElementById('statsSize'),
    statsContentType: document.getElementById('statsContentType'),
    statsMethod: document.getElementById('statsMethod'),
    statsTimestamp: document.getElementById('statsTimestamp'),

    // Footer
    connectionStatus: document.getElementById('connectionStatus'),
    footerActiveUrl: document.getElementById('footerActiveUrl'),

    // Modals
    codeModal: document.getElementById('codeModal'),
    codeModalTabs: document.querySelectorAll('.code-tab'),
    codeSnippetContent: document.getElementById('codeSnippetContent'),
    copySnippetBtn: document.getElementById('copySnippetBtn'),

    saveModal: document.getElementById('saveModal'),
    saveReqNameInput: document.getElementById('saveReqNameInput'),
    saveReqCollectionSelect: document.getElementById('saveReqCollectionSelect'),
    confirmSaveRequestBtn: document.getElementById('confirmSaveRequestBtn'),

    envModal: document.getElementById('envModal'),
    envTableBody: document.getElementById('envTableBody'),
    addEnvVarBtn: document.getElementById('addEnvVarBtn'),
    saveEnvVarsBtn: document.getElementById('saveEnvVarsBtn'),

    settingsModal: document.getElementById('settingsModal'),
    settingTimeoutInput: document.getElementById('settingTimeoutInput'),
    settingCorsProxyUrl: document.getElementById('settingCorsProxyUrl'),
    resetAllDataBtn: document.getElementById('resetAllDataBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),

    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================
  function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // =========================================================================
  // LOCALSTORAGE MANAGEMENT
  // =========================================================================
  function loadPersistedState() {
    // Theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    applyTheme(savedTheme);

    // Proxy
    const savedProxy = localStorage.getItem(STORAGE_KEYS.PROXY_ENABLED);
    state.corsProxyActive = savedProxy === 'true';
    updateProxyUI();

    // Settings
    try {
      const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
      if (savedSettings) state.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
    } catch (e) {
      state.settings = { ...DEFAULT_SETTINGS };
    }
    DOM.settingTimeoutInput.value = state.settings.timeoutSeconds;
    DOM.settingCorsProxyUrl.value = state.settings.corsProxyUrl;

    // Env Vars
    try {
      state.envVars = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENV_VARS)) || [
        { enabled: true, key: 'baseUrl', value: 'https://jsonplaceholder.typicode.com' }
      ];
    } catch (e) {
      state.envVars = [];
    }
    updateEnvBadge();

    // History
    try {
      state.history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
    } catch (e) {
      state.history = [];
    }
    renderHistoryList();

    // Collections
    try {
      state.collections = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTIONS)) || DEFAULT_COLLECTIONS;
    } catch (e) {
      state.collections = DEFAULT_COLLECTIONS;
    }
    renderCollectionsList();
  }

  function persistHistory() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history.slice(0, 80)));
  }

  function persistCollections() {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(state.collections));
  }

  function persistEnvVars() {
    localStorage.setItem(STORAGE_KEYS.ENV_VARS, JSON.stringify(state.envVars));
    updateEnvBadge();
  }

  function persistSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  }

  // =========================================================================
  // THEME SWITCHER
  // =========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    if (theme === 'dark') {
      DOM.themeIconSun.classList.remove('hidden');
      DOM.themeIconMoon.classList.add('hidden');
    } else {
      DOM.themeIconSun.classList.add('hidden');
      DOM.themeIconMoon.classList.remove('hidden');
    }
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  // =========================================================================
  // CORS PROXY TOGGLE
  // =========================================================================
  function updateProxyUI() {
    if (state.corsProxyActive) {
      DOM.proxyToggleBtn.classList.add('active');
      DOM.proxyStatusText.textContent = 'ON';
    } else {
      DOM.proxyToggleBtn.classList.remove('active');
      DOM.proxyStatusText.textContent = 'OFF';
    }
  }

  function toggleCorsProxy() {
    state.corsProxyActive = !state.corsProxyActive;
    localStorage.setItem(STORAGE_KEYS.PROXY_ENABLED, state.corsProxyActive);
    updateProxyUI();
    showToast(state.corsProxyActive ? 'CORS Proxy Enabled' : 'CORS Proxy Disabled', 'info');
  }

  // =========================================================================
  // ENVIRONMENT VARIABLE RESOLUTION
  // =========================================================================
  function updateEnvBadge() {
    const activeCount = state.envVars.filter(v => v.enabled && v.key.trim()).length;
    DOM.activeEnvBadge.textContent = activeCount;
  }

  function interpolateVariables(text) {
    if (!text || typeof text !== 'string') return text;
    let result = text;
    state.envVars.forEach(v => {
      if (v.enabled && v.key.trim()) {
        const regex = new RegExp(`{{\\s*${v.key.trim()}\\s*}}`, 'g');
        result = result.replace(regex, v.value);
      }
    });
    return result;
  }

  function renderEnvVarsTable() {
    DOM.envTableBody.innerHTML = '';
    state.envVars.forEach((v, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="checkbox-col">
          <input type="checkbox" class="kv-checkbox env-toggle" ${v.enabled ? 'checked' : ''} data-index="${index}">
        </td>
        <td>
          <input type="text" class="kv-input env-key" placeholder="variable_name" value="${escapeHtml(v.key)}" data-index="${index}">
        </td>
        <td>
          <input type="text" class="kv-input env-value" placeholder="variable_value" value="${escapeHtml(v.value)}" data-index="${index}">
        </td>
        <td>
          <button class="kv-row-delete-btn env-delete" data-index="${index}" title="Remove variable">&times;</button>
        </td>
      `;
      DOM.envTableBody.appendChild(tr);
    });

    if (state.envVars.length === 0) {
      addEnvVarRow();
    }
  }

  function addEnvVarRow(key = '', value = '', enabled = true) {
    state.envVars.push({ enabled, key, value });
    renderEnvVarsTable();
  }

  // =========================================================================
  // HTTP METHOD STYLING & SYNC
  // =========================================================================
  function updateMethodStyles() {
    const method = DOM.httpMethodSelect.value;
    DOM.httpMethodSelect.setAttribute('data-method', method);
  }

  // =========================================================================
  // QUERY PARAMETERS & URL SYNCHRONIZATION
  // =========================================================================
  function getParamsFromTable() {
    const rows = DOM.paramsTableBody.querySelectorAll('tr');
    const params = [];
    rows.forEach(row => {
      const checkbox = row.querySelector('.param-toggle');
      const keyInput = row.querySelector('.param-key');
      const valInput = row.querySelector('.param-value');
      const descInput = row.querySelector('.param-desc');
      if (keyInput && valInput) {
        params.push({
          enabled: checkbox ? checkbox.checked : true,
          key: keyInput.value,
          value: valInput.value,
          desc: descInput ? descInput.value : ''
        });
      }
    });
    return params;
  }

  function renderParamsTable(params) {
    DOM.paramsTableBody.innerHTML = '';
    params.forEach((param, index) => {
      createParamRow(param.key, param.value, param.desc, param.enabled);
    });
    updateBadgesCount();
  }

  function createParamRow(key = '', value = '', desc = '', enabled = true) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="checkbox-col">
        <input type="checkbox" class="kv-checkbox param-toggle" ${enabled ? 'checked' : ''}>
      </td>
      <td>
        <input type="text" class="kv-input param-key" placeholder="Key" value="${escapeHtml(key)}">
      </td>
      <td>
        <input type="text" class="kv-input param-value" placeholder="Value" value="${escapeHtml(value)}">
      </td>
      <td>
        <input type="text" class="kv-input param-desc" placeholder="Description" value="${escapeHtml(desc)}">
      </td>
      <td>
        <button class="kv-row-delete-btn param-delete" title="Delete param">&times;</button>
      </td>
    `;

    // Row event listeners
    const toggle = tr.querySelector('.param-toggle');
    const keyInput = tr.querySelector('.param-key');
    const valInput = tr.querySelector('.param-value');
    const delBtn = tr.querySelector('.param-delete');

    toggle.addEventListener('change', () => {
      syncTableToUrl();
      updateBadgesCount();
    });

    keyInput.addEventListener('input', () => {
      syncTableToUrl();
      checkAddEmptyRow(DOM.paramsTableBody, createParamRow);
      updateBadgesCount();
    });

    valInput.addEventListener('input', () => {
      syncTableToUrl();
    });

    delBtn.addEventListener('click', () => {
      tr.remove();
      syncTableToUrl();
      updateBadgesCount();
      if (DOM.paramsTableBody.children.length === 0) {
        createParamRow('', '', '', true);
      }
    });

    DOM.paramsTableBody.appendChild(tr);
    return tr;
  }

  function checkAddEmptyRow(tbody, creatorFn) {
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) {
      creatorFn();
      return;
    }
    const lastRow = rows[rows.length - 1];
    const keyInput = lastRow.querySelector('input[type="text"]');
    if (keyInput && keyInput.value.trim() !== '') {
      creatorFn('', '', '', true);
    }
  }

  function syncUrlToTable() {
    if (state.isSyncingUrl) return;
    state.isSyncingUrl = true;

    try {
      const urlString = DOM.requestUrlInput.value.trim();
      DOM.footerActiveUrl.textContent = urlString || 'Ready';

      const qIndex = urlString.indexOf('?');
      if (qIndex !== -1) {
        const queryString = urlString.substring(qIndex + 1);
        const searchParams = new URLSearchParams(queryString);
        const newParams = [];

        searchParams.forEach((val, key) => {
          newParams.push({ enabled: true, key, value: val, desc: '' });
        });

        // Retain an empty row at end
        newParams.push({ enabled: true, key: '', value: '', desc: '' });
        renderParamsTable(newParams);
      } else {
        renderParamsTable([{ enabled: true, key: '', value: '', desc: '' }]);
      }
    } catch (e) {
      // Ignore URL parsing errors while user is actively typing
    } finally {
      state.isSyncingUrl = false;
    }
  }

  function syncTableToUrl() {
    if (state.isSyncingUrl) return;
    state.isSyncingUrl = true;

    try {
      const currentUrl = DOM.requestUrlInput.value.trim();
      const base = currentUrl.split('?')[0];

      const params = getParamsFromTable().filter(p => p.enabled && p.key.trim() !== '');
      if (params.length > 0) {
        const queryParts = params.map(p => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`);
        DOM.requestUrlInput.value = `${base}?${queryParts.join('&')}`;
      } else {
        DOM.requestUrlInput.value = base;
      }
      DOM.footerActiveUrl.textContent = DOM.requestUrlInput.value || 'Ready';
    } catch (e) {
      console.error('Error syncing table to URL:', e);
    } finally {
      state.isSyncingUrl = false;
    }
  }

  // =========================================================================
  // HEADERS MANAGEMENT
  // =========================================================================
  function getHeadersFromTable() {
    const rows = DOM.headersTableBody.querySelectorAll('tr');
    const headers = [];
    rows.forEach(row => {
      const checkbox = row.querySelector('.header-toggle');
      const keyInput = row.querySelector('.header-key');
      const valInput = row.querySelector('.header-value');
      const descInput = row.querySelector('.header-desc');
      if (keyInput && valInput) {
        headers.push({
          enabled: checkbox ? checkbox.checked : true,
          key: keyInput.value,
          value: valInput.value,
          desc: descInput ? descInput.value : ''
        });
      }
    });
    return headers;
  }

  function renderHeadersTable(headers) {
    DOM.headersTableBody.innerHTML = '';
    headers.forEach(h => {
      createHeaderRow(h.key, h.value, h.desc, h.enabled);
    });
    if (headers.length === 0) {
      createHeaderRow('', '', '', true);
    }
    updateBadgesCount();
  }

  function createHeaderRow(key = '', value = '', desc = '', enabled = true) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="checkbox-col">
        <input type="checkbox" class="kv-checkbox header-toggle" ${enabled ? 'checked' : ''}>
      </td>
      <td>
        <input type="text" class="kv-input header-key" placeholder="Header Name" value="${escapeHtml(key)}">
      </td>
      <td>
        <input type="text" class="kv-input header-value" placeholder="Value" value="${escapeHtml(value)}">
      </td>
      <td>
        <input type="text" class="kv-input header-desc" placeholder="Description" value="${escapeHtml(desc)}">
      </td>
      <td>
        <button class="kv-row-delete-btn header-delete" title="Delete header">&times;</button>
      </td>
    `;

    const toggle = tr.querySelector('.header-toggle');
    const keyInput = tr.querySelector('.header-key');
    const valInput = tr.querySelector('.header-value');
    const delBtn = tr.querySelector('.header-delete');

    toggle.addEventListener('change', updateBadgesCount);
    keyInput.addEventListener('input', () => {
      checkAddEmptyRow(DOM.headersTableBody, createHeaderRow);
      updateBadgesCount();
    });
    valInput.addEventListener('input', updateBadgesCount);

    delBtn.addEventListener('click', () => {
      tr.remove();
      updateBadgesCount();
      if (DOM.headersTableBody.children.length === 0) {
        createHeaderRow('', '', '', true);
      }
    });

    DOM.headersTableBody.appendChild(tr);
    return tr;
  }

  function addOrUpdateHeader(key, value) {
    const rows = DOM.headersTableBody.querySelectorAll('tr');
    let found = false;
    rows.forEach(r => {
      const kInput = r.querySelector('.header-key');
      const vInput = r.querySelector('.header-value');
      const toggle = r.querySelector('.header-toggle');
      if (kInput && kInput.value.toLowerCase() === key.toLowerCase()) {
        vInput.value = value;
        toggle.checked = true;
        found = true;
      }
    });

    if (!found) {
      createHeaderRow(key, value, '', true);
    }
    updateBadgesCount();
  }

  // =========================================================================
  // BODY MANAGEMENT & VALIDATION
  // =========================================================================
  function getSelectedBodyType() {
    const selected = document.querySelector('input[name="bodyType"]:checked');
    return selected ? selected.value : 'none';
  }

  function setBodyType(type) {
    const radio = document.querySelector(`input[name="bodyType"][value="${type}"]`);
    if (radio) {
      radio.checked = true;
      updateBodySubpanels(type);
    }
  }

  function updateBodySubpanels(type) {
    Object.keys(DOM.bodySubpanels).forEach(k => {
      if (DOM.bodySubpanels[k]) {
        DOM.bodySubpanels[k].classList.remove('active');
      }
    });

    if (type === 'form-data' || type === 'x-www-form-urlencoded') {
      DOM.bodySubpanels['form-data'].classList.add('active');
    } else if (DOM.bodySubpanels[type]) {
      DOM.bodySubpanels[type].classList.add('active');
    }

    // Toggle body indicator dot
    if (type === 'none') {
      DOM.bodyIndicator.classList.add('hidden');
    } else {
      DOM.bodyIndicator.classList.remove('hidden');
    }

    validateJsonBody();
  }

  function validateJsonBody() {
    const bodyType = getSelectedBodyType();
    if (bodyType !== 'json') {
      DOM.jsonValidationStatus.textContent = '';
      return true;
    }

    const val = DOM.jsonBodyTextarea.value.trim();
    if (!val) {
      DOM.jsonValidationStatus.textContent = 'Empty payload';
      DOM.jsonValidationStatus.className = 'validation-status';
      return true;
    }

    try {
      JSON.parse(interpolateVariables(val));
      DOM.jsonValidationStatus.textContent = 'Valid JSON';
      DOM.jsonValidationStatus.className = 'validation-status';
      return true;
    } catch (err) {
      DOM.jsonValidationStatus.textContent = `Invalid: ${err.message}`;
      DOM.jsonValidationStatus.className = 'validation-status invalid';
      return false;
    }
  }

  function formatJsonEditor() {
    const val = DOM.jsonBodyTextarea.value.trim();
    if (!val) return;
    try {
      const parsed = JSON.parse(val);
      DOM.jsonBodyTextarea.value = JSON.stringify(parsed, null, 2);
      validateJsonBody();
      showToast('JSON beautified successfully', 'info');
    } catch (err) {
      showToast('Cannot format: Invalid JSON syntax', 'error');
    }
  }

  function minifyJsonEditor() {
    const val = DOM.jsonBodyTextarea.value.trim();
    if (!val) return;
    try {
      const parsed = JSON.parse(val);
      DOM.jsonBodyTextarea.value = JSON.stringify(parsed);
      validateJsonBody();
      showToast('JSON minified', 'info');
    } catch (err) {
      showToast('Cannot minify: Invalid JSON syntax', 'error');
    }
  }

  function createFormDataRow(key = '', value = '', enabled = true) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="checkbox-col">
        <input type="checkbox" class="kv-checkbox form-toggle" ${enabled ? 'checked' : ''}>
      </td>
      <td>
        <input type="text" class="kv-input form-key" placeholder="Key" value="${escapeHtml(key)}">
      </td>
      <td>
        <input type="text" class="kv-input form-value" placeholder="Value" value="${escapeHtml(value)}">
      </td>
      <td>
        <button class="kv-row-delete-btn form-delete" title="Delete field">&times;</button>
      </td>
    `;

    const keyInput = tr.querySelector('.form-key');
    const delBtn = tr.querySelector('.form-delete');

    keyInput.addEventListener('input', () => {
      checkAddEmptyRow(DOM.formDataTableBody, createFormDataRow);
    });

    delBtn.addEventListener('click', () => {
      tr.remove();
      if (DOM.formDataTableBody.children.length === 0) {
        createFormDataRow('', '', true);
      }
    });

    DOM.formDataTableBody.appendChild(tr);
    return tr;
  }

  function getFormDataFromTable() {
    const rows = DOM.formDataTableBody.querySelectorAll('tr');
    const data = [];
    rows.forEach(r => {
      const toggle = r.querySelector('.form-toggle');
      const k = r.querySelector('.form-key');
      const v = r.querySelector('.form-value');
      if (k && v && toggle && toggle.checked && k.value.trim() !== '') {
        data.push({ key: k.value.trim(), value: v.value });
      }
    });
    return data;
  }

  // =========================================================================
  // AUTHORIZATION MANAGEMENT
  // =========================================================================
  function setAuthType(type) {
    DOM.authTypeSelect.value = type;
    updateAuthSubpanels(type);
  }

  function updateAuthSubpanels(type) {
    Object.keys(DOM.authSubpanels).forEach(k => {
      if (DOM.authSubpanels[k]) {
        DOM.authSubpanels[k].classList.remove('active');
      }
    });

    if (DOM.authSubpanels[type]) {
      DOM.authSubpanels[type].classList.add('active');
    }

    if (type === 'none') {
      DOM.authIndicator.classList.add('hidden');
    } else {
      DOM.authIndicator.classList.remove('hidden');
    }
  }

  // =========================================================================
  // BADGES & INDICATORS COUNT
  // =========================================================================
  function updateBadgesCount() {
    const activeParams = getParamsFromTable().filter(p => p.enabled && p.key.trim() !== '').length;
    DOM.paramsCountBadge.textContent = activeParams;

    const activeHeaders = getHeadersFromTable().filter(h => h.enabled && h.key.trim() !== '').length;
    DOM.headersCountBadge.textContent = activeHeaders;
  }

  // =========================================================================
  // REQUEST PREPARATION & BUILDING
  // =========================================================================
  function buildFinalRequestConfig() {
    const method = DOM.httpMethodSelect.value;
    let url = DOM.requestUrlInput.value.trim();

    if (!url) {
      throw new Error('Please enter a request URL');
    }

    // Variable interpolation
    url = interpolateVariables(url);

    // Auto prepend protocol if omitted
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      DOM.requestUrlInput.value = url;
    }

    // Build Headers
    const headersObj = {};
    const rawHeaders = getHeadersFromTable().filter(h => h.enabled && h.key.trim() !== '');
    rawHeaders.forEach(h => {
      headersObj[interpolateVariables(h.key.trim())] = interpolateVariables(h.value);
    });

    // Handle Authorization
    const authType = DOM.authTypeSelect.value;
    if (authType === 'bearer') {
      const token = interpolateVariables(DOM.bearerTokenInput.value.trim());
      if (token) {
        headersObj['Authorization'] = `Bearer ${token}`;
      }
    } else if (authType === 'basic') {
      const user = interpolateVariables(DOM.basicUsernameInput.value.trim());
      const pass = interpolateVariables(DOM.basicPasswordInput.value.trim());
      if (user || pass) {
        const credentials = btoa(`${user}:${pass}`);
        headersObj['Authorization'] = `Basic ${credentials}`;
      }
    } else if (authType === 'apikey') {
      const keyName = interpolateVariables(DOM.apiKeyNameInput.value.trim());
      const keyVal = interpolateVariables(DOM.apiKeyValueInput.value.trim());
      const location = DOM.apiKeyLocationSelect.value;
      if (keyName && keyVal) {
        if (location === 'header') {
          headersObj[keyName] = keyVal;
        } else {
          // Append to URL query param
          const delimiter = url.includes('?') ? '&' : '?';
          url = `${url}${delimiter}${encodeURIComponent(keyName)}=${encodeURIComponent(keyVal)}`;
        }
      }
    }

    // Build Request Body
    let body = null;
    const bodyType = getSelectedBodyType();

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (bodyType === 'json') {
        const jsonContent = DOM.jsonBodyTextarea.value.trim();
        if (jsonContent) {
          const interpolated = interpolateVariables(jsonContent);
          try {
            JSON.parse(interpolated); // validate
            body = interpolated;
            if (!headersObj['Content-Type']) {
              headersObj['Content-Type'] = 'application/json';
            }
          } catch (e) {
            throw new Error(`JSON body syntax error: ${e.message}`);
          }
        }
      } else if (bodyType === 'raw') {
        const rawContent = DOM.rawBodyTextarea.value;
        if (rawContent) {
          body = interpolateVariables(rawContent);
        }
      } else if (bodyType === 'x-www-form-urlencoded') {
        const formData = getFormDataFromTable();
        if (formData.length > 0) {
          const formParams = new URLSearchParams();
          formData.forEach(item => {
            formParams.append(interpolateVariables(item.key), interpolateVariables(item.value));
          });
          body = formParams.toString();
          if (!headersObj['Content-Type']) {
            headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
          }
        }
      } else if (bodyType === 'form-data') {
        const formData = getFormDataFromTable();
        if (formData.length > 0) {
          const fd = new FormData();
          formData.forEach(item => {
            fd.append(interpolateVariables(item.key), interpolateVariables(item.value));
          });
          body = fd;
          // Note: browser automatically sets multipart/form-data boundary
          delete headersObj['Content-Type'];
        }
      }
    }

    // Apply CORS Proxy if toggled
    let fetchUrl = url;
    if (state.corsProxyActive) {
      const proxyBase = state.settings.corsProxyUrl || DEFAULT_SETTINGS.corsProxyUrl;
      fetchUrl = `${proxyBase}${encodeURIComponent(url)}`;
    }

    return {
      method,
      url,
      fetchUrl,
      headers: headersObj,
      body,
      bodyType,
      authType
    };
  }

  // =========================================================================
  // SEND REQUEST & EXECUTION
  // =========================================================================
  async function executeRequest() {
    if (state.isRequestInProgress) return;

    let reqConfig;
    try {
      reqConfig = buildFinalRequestConfig();
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }

    // Set UI to loading state
    setRequestLoading(true);

    // Setup AbortController
    state.activeAbortController = new AbortController();
    const timeoutSeconds = parseInt(state.settings.timeoutSeconds, 10) || 15;
    const timeoutId = setTimeout(() => {
      if (state.activeAbortController) {
        state.activeAbortController.abort('Request timed out');
      }
    }, timeoutSeconds * 1000);

    state.requestStartTime = performance.now();
    startElapsedTimer();

    try {
      const fetchOptions = {
        method: reqConfig.method,
        headers: reqConfig.headers,
        signal: state.activeAbortController.signal
      };

      if (reqConfig.body && !['GET', 'HEAD'].includes(reqConfig.method)) {
        fetchOptions.body = reqConfig.body;
      }

      const response = await fetch(reqConfig.fetchUrl, fetchOptions);
      clearTimeout(timeoutId);

      const endTime = performance.now();
      const roundTripMs = Math.round(endTime - state.requestStartTime);

      // Collect response headers
      const resHeaders = {};
      response.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      // Read response content
      const contentType = response.headers.get('content-type') || '';
      let rawText = '';
      let resSize = 0;

      try {
        const blob = await response.blob();
        resSize = blob.size;
        rawText = await blob.text();
      } catch (readErr) {
        rawText = '';
      }

      const responseData = {
        status: response.status,
        statusText: response.statusText || getStatusText(response.status),
        timeMs: roundTripMs,
        sizeBytes: resSize,
        headers: resHeaders,
        contentType,
        bodyText: rawText,
        requestConfig: reqConfig,
        timestamp: new Date().toLocaleTimeString()
      };

      state.lastResponse = responseData;
      renderResponse(responseData);

      // Add to History
      recordHistory(reqConfig, responseData);

    } catch (error) {
      clearTimeout(timeoutId);
      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - state.requestStartTime);

      if (error.name === 'AbortError' || error === 'Request timed out') {
        renderCancelledOrTimedOut(error.message || 'Request cancelled by user');
      } else {
        renderNetworkOrCorsError(error, reqConfig, elapsedMs);
      }
    } finally {
      stopElapsedTimer();
      setRequestLoading(false);
      state.activeAbortController = null;
    }
  }

  function cancelRequest() {
    if (state.activeAbortController) {
      state.activeAbortController.abort('Request cancelled by user');
      showToast('Request cancelled', 'info');
    }
  }

  function setRequestLoading(isLoading) {
    state.isRequestInProgress = isLoading;
    if (isLoading) {
      DOM.sendBtn.disabled = true;
      DOM.cancelBtn.classList.remove('hidden');
      DOM.responseLoadingOverlay.classList.remove('hidden');
      DOM.connectionStatus.className = 'footer-status-pill busy';
      DOM.connectionStatus.innerHTML = '<span class="status-dot"></span> Sending...';
    } else {
      DOM.sendBtn.disabled = false;
      DOM.cancelBtn.classList.add('hidden');
      DOM.responseLoadingOverlay.classList.add('hidden');
      DOM.connectionStatus.className = 'footer-status-pill online';
      DOM.connectionStatus.innerHTML = '<span class="status-dot"></span> Ready';
    }
  }

  function startElapsedTimer() {
    DOM.elapsedTimer.textContent = '0.0s';
    state.elapsedInterval = setInterval(() => {
      const elapsed = ((performance.now() - state.requestStartTime) / 1000).toFixed(1);
      DOM.elapsedTimer.textContent = `${elapsed}s`;
    }, 100);
  }

  function stopElapsedTimer() {
    if (state.elapsedInterval) {
      clearInterval(state.elapsedInterval);
      state.elapsedInterval = null;
    }
  }

  // =========================================================================
  // RESPONSE RENDERING & SYNTAX HIGHLIGHTING
  // =========================================================================
  function renderResponse(res) {
    // Hide states
    DOM.responseEmptyState.classList.add('hidden');
    DOM.responseErrorState.classList.add('hidden');

    // Update Status Badge
    DOM.resStatusPill.className = `metric-item status-metric ${getStatusClass(res.status)}`;
    DOM.resStatusText.textContent = `${res.status} ${res.statusText}`;
    DOM.resTimeText.textContent = `${res.timeMs} ms`;
    DOM.resSizeText.textContent = formatBytes(res.sizeBytes);

    // Headers Tab
    DOM.responseHeadersTableBody.innerHTML = '';
    const headerEntries = Object.entries(res.headers);
    DOM.resHeadersBadge.textContent = headerEntries.length;

    headerEntries.forEach(([key, val]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--text-secondary);">${escapeHtml(key)}</td>
        <td style="font-family: var(--font-mono);">${escapeHtml(val)}</td>
      `;
      DOM.responseHeadersTableBody.appendChild(tr);
    });

    // Stats Tab
    DOM.statsStatusCode.textContent = `${res.status} ${res.statusText}`;
    DOM.statsTime.textContent = `${res.timeMs} ms`;
    DOM.statsSize.textContent = `${formatBytes(res.sizeBytes)} (${res.sizeBytes} bytes)`;
    DOM.statsContentType.textContent = res.contentType || 'N/A';
    DOM.statsMethod.textContent = res.requestConfig.method;
    DOM.statsTimestamp.textContent = res.timestamp;

    // Body & Raw
    DOM.responseRawViewer.value = res.bodyText;

    // Pretty syntax highlighting
    const isJson = res.contentType.includes('json') || isJsonString(res.bodyText);
    if (isJson) {
      try {
        const parsed = JSON.parse(res.bodyText);
        DOM.responsePrettyViewer.innerHTML = syntaxHighlightJson(parsed);
      } catch (e) {
        DOM.responsePrettyViewer.textContent = res.bodyText;
      }
    } else {
      DOM.responsePrettyViewer.textContent = res.bodyText;
    }

    // HTML Preview
    if (res.contentType.includes('html')) {
      DOM.previewIframe.classList.remove('hidden');
      DOM.previewFallback.classList.add('hidden');
      DOM.previewIframe.srcdoc = res.bodyText;
    } else {
      DOM.previewIframe.classList.add('hidden');
      DOM.previewFallback.classList.remove('hidden');
    }

    // Switch to active response subpanel
    switchResponseTab(state.activeResTab || 'body');
  }

  function renderCancelledOrTimedOut(msg) {
    DOM.responseEmptyState.classList.add('hidden');
    DOM.responseErrorState.classList.remove('hidden');

    DOM.errorTitle.textContent = 'Request Aborted';
    DOM.errorMessage.textContent = msg;

    DOM.resStatusPill.className = 'metric-item status-metric status-4xx';
    DOM.resStatusText.textContent = 'ABORTED';
    DOM.resTimeText.textContent = `${Math.round(performance.now() - state.requestStartTime)} ms`;
    DOM.resSizeText.textContent = '0 B';

    hideAllResponseSubpanels();
  }

  function renderNetworkOrCorsError(err, reqConfig, elapsedMs) {
    DOM.responseEmptyState.classList.add('hidden');
    DOM.responseErrorState.classList.remove('hidden');

    DOM.errorTitle.textContent = 'Network or CORS Error';
    DOM.errorMessage.textContent = `${err.message || 'Failed to fetch'}. The requested resource was blocked or server is offline.`;

    DOM.resStatusPill.className = 'metric-item status-metric status-5xx';
    DOM.resStatusText.textContent = 'ERROR';
    DOM.resTimeText.textContent = `${elapsedMs} ms`;
    DOM.resSizeText.textContent = '0 B';

    hideAllResponseSubpanels();
  }

  function hideAllResponseSubpanels() {
    Object.keys(DOM.resSubpanels).forEach(k => {
      DOM.resSubpanels[k].classList.add('hidden');
    });
  }

  function switchResponseTab(tabKey) {
    state.activeResTab = tabKey;
    DOM.resTabs.forEach(tab => {
      const isTarget = tab.getAttribute('data-res-tab') === tabKey;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget);
    });

    Object.keys(DOM.resSubpanels).forEach(k => {
      if (DOM.resSubpanels[k]) {
        DOM.resSubpanels[k].classList.toggle('hidden', k !== tabKey);
      }
    });
  }

  function syntaxHighlightJson(jsonObj) {
    const jsonStr = JSON.stringify(jsonObj, null, 2);
    return jsonStr.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
            return `<span class="${cls}">${escapeHtml(match.slice(0, -1))}</span>:`;
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${escapeHtml(match)}</span>`;
      }
    );
  }

  function isJsonString(str) {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getStatusClass(status) {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    return 'status-5xx';
  }

  function getStatusText(status) {
    const map = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      301: 'Moved Permanently',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return map[status] || 'Response';
  }

  // =========================================================================
  // REQUEST HISTORY
  // =========================================================================
  function recordHistory(reqConfig, res) {
    const item = {
      id: generateId('hist'),
      method: reqConfig.method,
      url: reqConfig.url,
      status: res.status,
      timeMs: res.timeMs,
      timestamp: new Date().toLocaleTimeString(),
      params: getParamsFromTable(),
      headers: getHeadersFromTable(),
      bodyType: reqConfig.bodyType,
      bodyJson: DOM.jsonBodyTextarea.value,
      bodyRaw: DOM.rawBodyTextarea.value,
      auth: {
        type: DOM.authTypeSelect.value,
        bearer: DOM.bearerTokenInput.value,
        username: DOM.basicUsernameInput.value,
        password: DOM.basicPasswordInput.value,
        apiKeyName: DOM.apiKeyNameInput.value,
        apiKeyValue: DOM.apiKeyValueInput.value,
        apiKeyLocation: DOM.apiKeyLocationSelect.value
      }
    };

    state.history.unshift(item);
    persistHistory();
    renderHistoryList();
  }

  function renderHistoryList(filterQuery = '') {
    DOM.historyList.innerHTML = '';
    const query = filterQuery.toLowerCase().trim();
    const filtered = state.history.filter(h => {
      if (!query) return true;
      return h.url.toLowerCase().includes(query) || h.method.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      DOM.historyList.innerHTML = `
        <div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <p>${query ? 'No matching history' : 'No requests sent yet'}</p>
          <span>${query ? 'Try a different keyword' : 'Execute requests to track history'}</span>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-item-left">
          <span class="history-method-badge badge-${item.method.toLowerCase()}">${item.method}</span>
          <div class="history-details">
            <span class="history-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</span>
            <span class="history-time">${item.timestamp} &bull; ${item.timeMs}ms</span>
          </div>
        </div>
        <div class="history-item-right">
          <span class="history-status-badge ${getStatusClass(item.status)}">${item.status}</span>
          <button class="history-delete-btn" title="Delete entry">&times;</button>
        </div>
      `;

      // Click to restore request
      div.addEventListener('click', (e) => {
        if (e.target.closest('.history-delete-btn')) return;
        restoreRequest(item);
        document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
        div.classList.add('active');
      });

      // Delete single entry
      const delBtn = div.querySelector('.history-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.history = state.history.filter(h => h.id !== item.id);
        persistHistory();
        renderHistoryList(DOM.historySearchInput.value);
        showToast('History item removed', 'info');
      });

      DOM.historyList.appendChild(div);
    });
  }

  function clearHistory() {
    if (confirm('Are you sure you want to clear all request history?')) {
      state.history = [];
      persistHistory();
      renderHistoryList();
      showToast('History cleared', 'info');
    }
  }

  // =========================================================================
  // COLLECTIONS MANAGEMENT
  // =========================================================================
  function renderCollectionsList() {
    DOM.collectionsList.innerHTML = '';
    if (state.collections.length === 0) {
      DOM.collectionsList.innerHTML = `
        <div class="empty-state">
          <p>No collections yet</p>
          <span>Create one to organize requests</span>
        </div>
      `;
      return;
    }

    state.collections.forEach(col => {
      const folder = document.createElement('div');
      folder.className = 'collection-folder';

      folder.innerHTML = `
        <div class="folder-header">
          <div class="folder-title-group">
            <svg class="folder-arrow expanded" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>${escapeHtml(col.name)}</span>
            <span class="badge-pill">${col.requests.length}</span>
          </div>
          <div class="folder-actions">
            <button class="icon-btn-text delete-folder-btn" title="Delete Collection">&times;</button>
          </div>
        </div>
        <div class="folder-requests"></div>
      `;

      const folderHeader = folder.querySelector('.folder-header');
      const arrow = folder.querySelector('.folder-arrow');
      const requestsContainer = folder.querySelector('.folder-requests');
      const delFolderBtn = folder.querySelector('.delete-folder-btn');

      // Expand / Collapse toggle
      folderHeader.addEventListener('click', (e) => {
        if (e.target.closest('.delete-folder-btn')) return;
        arrow.classList.toggle('expanded');
        requestsContainer.classList.toggle('hidden');
      });

      // Delete collection
      delFolderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete collection "${col.name}" and all its requests?`)) {
          state.collections = state.collections.filter(c => c.id !== col.id);
          persistCollections();
          renderCollectionsList();
          showToast(`Deleted collection "${col.name}"`, 'info');
        }
      });

      // Render requests inside collection
      if (col.requests.length === 0) {
        requestsContainer.innerHTML = '<span class="empty-state-sm" style="display:block; padding: 8px;">Empty collection</span>';
      } else {
        col.requests.forEach(req => {
          const reqEl = document.createElement('div');
          reqEl.className = 'saved-req-item';
          reqEl.innerHTML = `
            <span class="history-method-badge badge-${req.method.toLowerCase()}">${req.method}</span>
            <span class="saved-req-name" title="${escapeHtml(req.url)}">${escapeHtml(req.name || req.url)}</span>
            <button class="history-delete-btn delete-req-btn" title="Delete request">&times;</button>
          `;

          reqEl.addEventListener('click', (e) => {
            if (e.target.closest('.delete-req-btn')) return;
            restoreRequest(req);
            showToast(`Loaded "${req.name || req.url}"`, 'info');
          });

          const delReqBtn = reqEl.querySelector('.delete-req-btn');
          delReqBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            col.requests = col.requests.filter(r => r.id !== req.id);
            persistCollections();
            renderCollectionsList();
            showToast('Request deleted from collection', 'info');
          });

          requestsContainer.appendChild(reqEl);
        });
      }

      DOM.collectionsList.appendChild(folder);
    });
  }

  function createNewCollection() {
    const name = prompt('Enter collection name:');
    if (!name || !name.trim()) return;

    const newCol = {
      id: generateId('col'),
      name: name.trim(),
      requests: []
    };
    state.collections.push(newCol);
    persistCollections();
    renderCollectionsList();
    showToast(`Created collection "${newCol.name}"`, 'info');
  }

  function openSaveModal() {
    if (state.collections.length === 0) {
      createNewCollection();
      if (state.collections.length === 0) return;
    }

    DOM.saveReqNameInput.value = DOM.requestUrlInput.value.split('?')[0].split('/').pop() || 'New Request';
    DOM.saveReqCollectionSelect.innerHTML = '';
    state.collections.forEach(col => {
      const opt = document.createElement('option');
      opt.value = col.id;
      opt.textContent = col.name;
      DOM.saveReqCollectionSelect.appendChild(opt);
    });

    openModal(DOM.saveModal);
  }

  function confirmSaveRequest() {
    const name = DOM.saveReqNameInput.value.trim();
    const colId = DOM.saveReqCollectionSelect.value;
    if (!name) {
      showToast('Please enter a request name', 'error');
      return;
    }

    const col = state.collections.find(c => c.id === colId);
    if (!col) return;

    const savedItem = {
      id: generateId('req'),
      name,
      method: DOM.httpMethodSelect.value,
      url: DOM.requestUrlInput.value.trim(),
      params: getParamsFromTable(),
      headers: getHeadersFromTable(),
      bodyType: getSelectedBodyType(),
      bodyJson: DOM.jsonBodyTextarea.value,
      bodyRaw: DOM.rawBodyTextarea.value,
      auth: {
        type: DOM.authTypeSelect.value,
        bearer: DOM.bearerTokenInput.value,
        username: DOM.basicUsernameInput.value,
        password: DOM.basicPasswordInput.value,
        apiKeyName: DOM.apiKeyNameInput.value,
        apiKeyValue: DOM.apiKeyValueInput.value,
        apiKeyLocation: DOM.apiKeyLocationSelect.value
      }
    };

    col.requests.push(savedItem);
    persistCollections();
    renderCollectionsList();
    closeModal(DOM.saveModal);
    showToast(`Saved to collection "${col.name}"`, 'info');
  }

  function exportCollections() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.collections, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'apiforge-collections.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported collections to JSON', 'info');
  }

  function importCollectionsFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          state.collections = [...state.collections, ...imported];
          persistCollections();
          renderCollectionsList();
          showToast(`Imported ${imported.length} collection(s)`, 'info');
        } else {
          showToast('Invalid collection JSON file', 'error');
        }
      } catch (err) {
        showToast('Error reading JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // =========================================================================
  // RESTORE SAVED REQUEST INTO BUILDER
  // =========================================================================
  function restoreRequest(req) {
    DOM.httpMethodSelect.value = req.method || 'GET';
    updateMethodStyles();

    DOM.requestUrlInput.value = req.url || '';
    DOM.footerActiveUrl.textContent = req.url || 'Ready';

    // Params
    if (req.params && Array.isArray(req.params)) {
      renderParamsTable(req.params);
    } else {
      syncUrlToTable();
    }

    // Headers
    if (req.headers && Array.isArray(req.headers)) {
      renderHeadersTable(req.headers);
    } else {
      renderHeadersTable([]);
    }

    // Body
    const bType = req.bodyType || 'none';
    setBodyType(bType);
    if (req.bodyJson !== undefined) DOM.jsonBodyTextarea.value = req.bodyJson;
    if (req.bodyRaw !== undefined) DOM.rawBodyTextarea.value = req.bodyRaw;

    // Auth
    if (req.auth) {
      setAuthType(req.auth.type || 'none');
      DOM.bearerTokenInput.value = req.auth.bearer || '';
      DOM.basicUsernameInput.value = req.auth.username || '';
      DOM.basicPasswordInput.value = req.auth.password || '';
      DOM.apiKeyNameInput.value = req.auth.apiKeyName || 'X-API-Key';
      DOM.apiKeyValueInput.value = req.auth.apiKeyValue || '';
      DOM.apiKeyLocationSelect.value = req.auth.apiKeyLocation || 'header';
    } else {
      setAuthType('none');
    }

    updateBadgesCount();
  }

  // =========================================================================
  // CODE SNIPPET GENERATOR
  // =========================================================================
  function generateCodeSnippet(lang = 'curl') {
    let reqConfig;
    try {
      reqConfig = buildFinalRequestConfig();
    } catch (e) {
      reqConfig = {
        method: DOM.httpMethodSelect.value,
        url: DOM.requestUrlInput.value || 'https://api.example.com/v1',
        headers: {},
        body: null
      };
    }

    const { method, url, headers, body } = reqConfig;
    let snippet = '';

    if (lang === 'curl') {
      snippet = `curl -X ${method} "${url}"`;
      Object.entries(headers).forEach(([k, v]) => {
        snippet += ` \\\n  -H "${k}: ${v}"`;
      });
      if (body) {
        if (typeof body === 'string') {
          snippet += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
        }
      }
    } else if (lang === 'fetch') {
      const opts = { method, headers };
      if (body && typeof body === 'string') {
        opts.body = body;
      }
      snippet = `fetch("${url}", ${JSON.stringify(opts, null, 2)})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
    } else if (lang === 'axios') {
      snippet = `const axios = require('axios');\n\naxios({\n  method: '${method.toLowerCase()}',\n  url: '${url}',\n  headers: ${JSON.stringify(headers, null, 2)}`;
      if (body) {
        snippet += `,\n  data: ${body}`;
      }
      snippet += `\n})\n.then(response => console.log(response.data))\n.catch(error => console.error(error));`;
    } else if (lang === 'python') {
      snippet = `import requests\n\nurl = "${url}"\nheaders = ${JSON.stringify(headers, null, 2)}\n`;
      if (body) {
        snippet += `data = ${body}\nresponse = requests.${method.toLowerCase()}(url, headers=headers, json=data)\n`;
      } else {
        snippet += `response = requests.${method.toLowerCase()}(url, headers=headers)\n`;
      }
      snippet += `print(response.status_code)\nprint(response.json())`;
    }

    DOM.codeSnippetContent.textContent = snippet;
  }

  function openCodeModal() {
    generateCodeSnippet(state.codeModalLang);
    openModal(DOM.codeModal);
  }

  // =========================================================================
  // MODAL CONTROLLERS
  // =========================================================================
  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  function setupModalDismissals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) closeModal(modal);
      });
    });

    // Close when clicking overlay backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay);
        }
      });
    });
  }

  // =========================================================================
  // RESPONSE ACTIONS: COPY, DOWNLOAD, SEARCH
  // =========================================================================
  function copyResponse() {
    if (!state.lastResponse) return;
    navigator.clipboard.writeText(state.lastResponse.bodyText).then(() => {
      showToast('Response copied to clipboard', 'info');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }

  function downloadResponse() {
    if (!state.lastResponse) return;
    const isJson = state.lastResponse.contentType.includes('json');
    const ext = isJson ? 'json' : 'txt';
    const blob = new Blob([state.lastResponse.bodyText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded response as .${ext}`, 'info');
  }

  function copyHeaders() {
    if (!state.lastResponse) return;
    const text = Object.entries(state.lastResponse.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showToast('Headers copied to clipboard', 'info');
    });
  }

  function filterResponsePretty(query) {
    if (!state.lastResponse) return;
    const container = DOM.responsePrettyViewer;
    if (!query) {
      if (isJsonString(state.lastResponse.bodyText)) {
        container.innerHTML = syntaxHighlightJson(JSON.parse(state.lastResponse.bodyText));
      } else {
        container.textContent = state.lastResponse.bodyText;
      }
      return;
    }

    // Highlight text matches
    const text = state.lastResponse.bodyText;
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const highlighted = escaped.replace(regex, '<span class="json-highlight-match">$1</span>');
    container.innerHTML = highlighted;
  }

  // =========================================================================
  // EVENT LISTENERS BINDING
  // =========================================================================
  function bindEventListeners() {
    // Top Toolbar
    DOM.sidebarToggleBtn.addEventListener('click', () => {
      DOM.sidebar.classList.toggle('collapsed');
    });

    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    DOM.proxyToggleBtn.addEventListener('click', toggleCorsProxy);

    DOM.samplePresetsSelect.addEventListener('change', (e) => {
      const presetKey = e.target.value;
      if (SAMPLE_PRESETS[presetKey]) {
        restoreRequest(SAMPLE_PRESETS[presetKey]);
        showToast(`Loaded preset: ${e.target.options[e.target.selectedIndex].text}`, 'info');
      }
      e.target.selectedIndex = 0;
    });

    DOM.envBtn.addEventListener('click', () => {
      renderEnvVarsTable();
      openModal(DOM.envModal);
    });

    DOM.codeSnippetBtn.addEventListener('click', openCodeModal);

    DOM.settingsBtn.addEventListener('click', () => {
      openModal(DOM.settingsModal);
    });

    // Sidebar Navigation
    DOM.tabBtnHistory.addEventListener('click', () => {
      DOM.tabBtnHistory.classList.add('active');
      DOM.tabBtnCollections.classList.remove('active');
      DOM.panelHistory.classList.add('active');
      DOM.panelCollections.classList.remove('active');
    });

    DOM.tabBtnCollections.addEventListener('click', () => {
      DOM.tabBtnCollections.classList.add('active');
      DOM.tabBtnHistory.classList.remove('active');
      DOM.panelCollections.classList.add('active');
      DOM.panelHistory.classList.remove('active');
    });

    DOM.historySearchInput.addEventListener('input', (e) => {
      renderHistoryList(e.target.value);
    });

    DOM.clearHistoryBtn.addEventListener('click', clearHistory);
    DOM.newCollectionBtn.addEventListener('click', createNewCollection);
    DOM.exportCollectionsBtn.addEventListener('click', exportCollections);
    DOM.importCollectionsBtn.addEventListener('click', () => DOM.collectionFileInput.click());
    DOM.collectionFileInput.addEventListener('change', importCollectionsFile);

    // Request Bar
    DOM.httpMethodSelect.addEventListener('change', updateMethodStyles);
    DOM.requestUrlInput.addEventListener('input', syncUrlToTable);
    DOM.sendBtn.addEventListener('click', executeRequest);
    DOM.cancelBtn.addEventListener('click', cancelRequest);
    DOM.saveRequestBtn.addEventListener('click', openSaveModal);
    DOM.confirmSaveRequestBtn.addEventListener('click', confirmSaveRequest);

    // Request Config Tabs
    DOM.paneTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        DOM.paneTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        Object.keys(DOM.tabPanels).forEach(k => {
          DOM.tabPanels[k].classList.toggle('active', k === targetTab);
        });
      });
    });

    // Params Controls
    DOM.addParamBtn.addEventListener('click', () => {
      createParamRow('', '', '', true);
      updateBadgesCount();
    });

    // Headers Controls
    DOM.addHeaderBtn.addEventListener('click', () => {
      createHeaderRow('', '', '', true);
      updateBadgesCount();
    });

    DOM.quickHeaderSelect.addEventListener('change', (e) => {
      const parts = e.target.value.split(':');
      if (parts.length === 2) {
        addOrUpdateHeader(parts[0], parts[1]);
        showToast(`Added header: ${parts[0]}`, 'info');
      }
      e.target.selectedIndex = 0;
    });

    // Body Controls
    DOM.bodyTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateBodySubpanels(e.target.value);
      });
    });

    DOM.jsonBodyTextarea.addEventListener('input', validateJsonBody);
    DOM.formatJsonBtn.addEventListener('click', formatJsonEditor);
    DOM.minifyJsonBtn.addEventListener('click', minifyJsonEditor);
    DOM.clearBodyBtn.addEventListener('click', () => {
      DOM.jsonBodyTextarea.value = '';
      DOM.rawBodyTextarea.value = '';
      validateJsonBody();
    });

    DOM.addFormDataRowBtn.addEventListener('click', () => {
      createFormDataRow('', '', true);
    });

    // Auth Controls
    DOM.authTypeSelect.addEventListener('change', (e) => {
      updateAuthSubpanels(e.target.value);
    });

    // Response Inspector Tabs
    DOM.resTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchResponseTab(tab.getAttribute('data-res-tab'));
      });
    });

    // Response Pretty vs Raw toggle
    DOM.resFormatPrettyBtn.addEventListener('click', () => {
      DOM.resFormatPrettyBtn.classList.add('active');
      DOM.resFormatRawBtn.classList.remove('active');
      DOM.responsePrettyViewer.classList.remove('hidden');
      DOM.responseRawViewer.classList.add('hidden');
    });

    DOM.resFormatRawBtn.addEventListener('click', () => {
      DOM.resFormatRawBtn.classList.add('active');
      DOM.resFormatPrettyBtn.classList.remove('active');
      DOM.responsePrettyViewer.classList.add('hidden');
      DOM.responseRawViewer.classList.remove('hidden');
    });

    DOM.responseSearchInput.addEventListener('input', (e) => {
      filterResponsePretty(e.target.value);
    });

    DOM.copyResponseBtn.addEventListener('click', copyResponse);
    DOM.downloadResponseBtn.addEventListener('click', downloadResponse);
    DOM.copyHeadersBtn.addEventListener('click', copyHeaders);

    // Troubleshoot actions in Error state
    DOM.enableProxyAndRetryBtn.addEventListener('click', () => {
      state.corsProxyActive = true;
      localStorage.setItem(STORAGE_KEYS.PROXY_ENABLED, 'true');
      updateProxyUI();
      showToast('CORS Proxy Enabled. Retrying request...', 'info');
      executeRequest();
    });

    DOM.loadSafeSampleBtn.addEventListener('click', () => {
      restoreRequest(SAMPLE_PRESETS['get-posts']);
      showToast('Loaded JSONPlaceholder sample', 'info');
      executeRequest();
    });

    // Code Snippet Tabs
    DOM.codeModalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        DOM.codeModalTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.codeModalLang = tab.getAttribute('data-lang');
        generateCodeSnippet(state.codeModalLang);
      });
    });

    DOM.copySnippetBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(DOM.codeSnippetContent.textContent).then(() => {
        showToast('Code snippet copied to clipboard', 'info');
      });
    });

    // Environment Variables Table Controls
    DOM.addEnvVarBtn.addEventListener('click', () => {
      addEnvVarRow('', '', true);
    });

    DOM.saveEnvVarsBtn.addEventListener('click', () => {
      const rows = DOM.envTableBody.querySelectorAll('tr');
      const vars = [];
      rows.forEach(r => {
        const toggle = r.querySelector('.env-toggle');
        const k = r.querySelector('.env-key');
        const v = r.querySelector('.env-value');
        if (k && v && k.value.trim() !== '') {
          vars.push({
            enabled: toggle ? toggle.checked : true,
            key: k.value.trim(),
            value: v.value
          });
        }
      });
      state.envVars = vars;
      persistEnvVars();
      closeModal(DOM.envModal);
      showToast('Environment variables saved', 'info');
    });

    // Settings Modal
    DOM.saveSettingsBtn.addEventListener('click', () => {
      state.settings.timeoutSeconds = parseInt(DOM.settingTimeoutInput.value, 10) || 15;
      state.settings.corsProxyUrl = DOM.settingCorsProxyUrl.value.trim() || DEFAULT_SETTINGS.corsProxyUrl;
      persistSettings();
      closeModal(DOM.settingsModal);
      showToast('Settings saved', 'info');
    });

    DOM.resetAllDataBtn.addEventListener('click', () => {
      if (confirm('Warning: This will clear all collections, history, and environment variables! Continue?')) {
        localStorage.clear();
        state.history = [];
        state.collections = DEFAULT_COLLECTIONS;
        state.envVars = [];
        state.settings = { ...DEFAULT_SETTINGS };
        loadPersistedState();
        closeModal(DOM.settingsModal);
        showToast('All local data reset', 'info');
      }
    });

    // Setup global modal dismiss buttons
    setupModalDismissals();

    // Keyboard Shortcuts: Ctrl+Enter (Send), Ctrl+S (Save), Esc (Cancel/Close Modal)
    window.addEventListener('keydown', (e) => {
      // Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeRequest();
      }
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        openSaveModal();
      }
      // Escape
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
          closeModal(modal);
        });
        if (state.isRequestInProgress) {
          cancelRequest();
        }
      }
    });
  }

  // =========================================================================
  // APP INITIALIZATION
  // =========================================================================
  function init() {
    loadPersistedState();
    updateMethodStyles();
    syncUrlToTable();
    createHeaderRow('', '', '', true);
    createFormDataRow('', '', true);
    bindEventListeners();
    updateBadgesCount();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
