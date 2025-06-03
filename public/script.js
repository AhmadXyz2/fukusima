
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const themeToggle = document.getElementById('theme-toggle');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');
  const currentSectionTitle = document.getElementById('current-section');
  const sectionDescription = document.getElementById('section-description');
  const endpointCount = document.getElementById('endpoint-count');
  const endpointsContainer = document.getElementById('endpoints-container');
  const activityFeed = document.getElementById('activity-feed');
  const endpointSearch = document.getElementById('endpoint-search');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const httpMethod = document.getElementById('http-method');
  const endpointPath = document.getElementById('endpoint-path');
  const sendRequestBtn = document.getElementById('send-request');
  const paramTabs = document.querySelectorAll('.param-tab');
  const paramsContents = document.querySelectorAll('.params-content');
  const responseTabs = document.querySelectorAll('.response-tab');
  const responseContents = document.querySelectorAll('.response-content pre');
  const responsePreview = document.getElementById('response-preview');
  const responseRaw = document.getElementById('response-raw');
  const responseHeaders = document.getElementById('response-headers');
  const responseStatus = document.getElementById('response-status');
  const queryParamsContainer = document.getElementById('query-params');
  const headersParamsContainer = document.getElementById('headers-params');
  const requestBody = document.getElementById('request-body');

  let apiEndpoints = [];
  let currentEndpoint = null;
  let activeParamsTab = 'query';
  let activeResponseTab = 'preview';

  // Theme
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  if (themeToggle) themeToggle.checked = currentTheme === 'dark';
  if (themeToggle) {
    themeToggle.addEventListener('change', function() {
      const newTheme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      const section = this.dataset.section;
      sections.forEach(sec => sec.classList.add('hidden'));
      const target = document.getElementById(`${section}-section`);
      if (target) target.classList.remove('hidden');
      currentSectionTitle.textContent = this.querySelector('span').textContent;
      updateSectionDescription(section);
    });
  });

  function updateSectionDescription(section) {
    const descriptions = {
      dashboard: 'Beta APIs Yang Akan Terus Dikembangkan.',
      endpoints: 'Jelajahi API yang tersedia ',
      documentation: 'Api Dengan Real-Time'
    };
    if (sectionDescription) {
      sectionDescription.textContent = descriptions[section] || '';
    }
  }

  // Fetch API Data
  fetch('/api/info')
    .then(res => res.json())
    .then(data => {
      apiEndpoints = data.endpoints;
      if (endpointCount) endpointCount.textContent = apiEndpoints.length;
      renderEndpoints(apiEndpoints);
      addActivityItem('GET', '/download/fb?url=https://facebook.com/video123');
      addActivityItem('POST', '/tobase64', { text: 'Hello World' });
    })
    .catch(err => {
      console.error('API Load Error:', err);
      if (endpointsContainer) {
        endpointsContainer.innerHTML = `<div class="error-message">Gagal memuat data endpoint.</div>`;
      }
    });

  function renderEndpoints(list) {
    if (!endpointsContainer) return;
    endpointsContainer.innerHTML = '';
    if (list.length === 0) {
      endpointsContainer.innerHTML = `<div class="empty-state">Tidak ada endpoint ditemukan.</div>`;
      return;
    }
    list.forEach(endpoint => {
      const el = document.createElement('div');
      el.className = `endpoint-card ${endpoint.status.toLowerCase()}`;
      el.innerHTML = `
        <div class="endpoint-header">
          <div class="endpoint-name">${endpoint.name}</div>
          <div class="endpoint-status status-${endpoint.status.toLowerCase()}">${endpoint.status}</div>
        </div>
        <div class="endpoint-body">
          <div class="endpoint-description">${endpoint.desc}</div>
          <div class="endpoint-path">${endpoint.path}</div>
        </div>
        <div class="endpoint-footer">
          <button class="try-btn" data-path="${endpoint.path}"><i class="fas fa-flask"></i> Coba</button>
        </div>
      `;
      endpointsContainer.appendChild(el);
    });
    document.querySelectorAll('.try-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const path = this.dataset.path;
        if (endpointPath) endpointPath.value = path;
        const docNav = document.querySelector('.nav-item[data-section="documentation"]');
        if (docNav) docNav.click();
      });
    });
  }

  // Filter
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const val = this.dataset.filter;
      const filtered = val === 'all' ? apiEndpoints : apiEndpoints.filter(ep => ep.status.toLowerCase() === val);
      renderEndpoints(filtered);
    });
  });

  // Search
  if (endpointSearch) {
    endpointSearch.addEventListener('input', function() {
      const val = this.value.toLowerCase();
      const results = apiEndpoints.filter(ep =>
        ep.name.toLowerCase().includes(val) ||
        ep.path.toLowerCase().includes(val) ||
        ep.desc.toLowerCase().includes(val)
      );
      renderEndpoints(results);
    });
  }

  // Params tabs
  paramTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      paramTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const selected = this.dataset.tab;
      paramsContents.forEach(c => c.classList.add('hidden'));
      const content = document.getElementById(`${selected}-params`);
      if (content) content.classList.remove('hidden');
    });
  });

  // Response tabs
  responseTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      responseTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const selected = this.dataset.tab;
      responseContents.forEach(c => c.classList.add('hidden'));
      if (selected === 'preview') responsePreview.classList.remove('hidden');
      else if (selected === 'raw') responseRaw.classList.remove('hidden');
      else responseHeaders.classList.remove('hidden');
    });
  });

  // Send API Request
  if (sendRequestBtn) {
    sendRequestBtn.addEventListener('click', function() {
      const method = httpMethod?.value || 'GET';
      let url = endpointPath?.value || '';
      if (!url) return;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          options.body = requestBody?.value || '{}';
        } catch (e) {
          return showError('Body tidak valid');
        }
      }
      responseStatus.textContent = 'Mengirim...';
      fetch(url, options)
        .then(res => res.json().then(data => ({ status: res.status, statusText: res.statusText, headers: res.headers, body: data })))
        .then(res => {
          responseStatus.textContent = `${res.status} ${res.statusText}`;
          responsePreview.textContent = JSON.stringify(res.body, null, 2);
          responseRaw.textContent = JSON.stringify(res.body, null, 2);
          const headersObj = {};
          res.headers.forEach((v, k) => headersObj[k] = v);
          responseHeaders.textContent = JSON.stringify(headersObj, null, 2);
          addActivityItem(method, url);
        })
        .catch(err => showError(err.message));
    });
  }

  function showError(msg) {
    responseStatus.textContent = `Error: ${msg}`;
    responseStatus.style.color = '#f44336';
    responsePreview.textContent = `{"error":"${msg}"}`;
    responseRaw.textContent = responsePreview.textContent;
    responseHeaders.textContent = '{}';
  }

  function addActivityItem(method, path) {
    if (!activityFeed) return;
    const item = document.createElement('div');
    item.className = 'activity-item';
    const icon = method === 'GET' ? 'download' : 'upload';
    const cls = method === 'GET' ? 'get-method' : 'post-method';
    item.innerHTML = `
      <div class="activity-icon"><i class="fas fa-${icon}"></i></div>
      <div class="activity-content">
        <div>
          <span class="activity-method ${cls}">${method}</span>
          <span class="activity-path">${path}</span>
        </div>
        <div class="activity-time">${new Date().toLocaleTimeString()}</div>
      </div>`;
    if (activityFeed.firstChild) {
      activityFeed.insertBefore(item, activityFeed.firstChild);
    } else {
      activityFeed.appendChild(item);
    }
    if (activityFeed.children.length > 10) {
      activityFeed.removeChild(activityFeed.lastChild);
    }
  }

  updateSectionDescription('dashboard');
});
