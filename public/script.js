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
    const sendRequest = document.getElementById('send-request');
    const paramTabs = document.querySelectorAll('.param-tab');
    const paramsContents = document.querySelectorAll('.params-content');
    const responseTabs = document.querySelectorAll('.response-tab');
    const responsePreviews = document.querySelectorAll('.response-content pre');
    const responsePreview = document.getElementById('response-preview');
    const responseRaw = document.getElementById('response-raw');
    const responseHeaders = document.getElementById('response-headers');
    const responseStatus = document.getElementById('response-status');
    const queryParams = document.getElementById('query-params');
    const headersParams = document.getElementById('headers-params');
    const requestBody = document.getElementById('request-body');
    
    const requestBody = document.getElementById('request-body');


    // Variables
    let endpoints = [];
    let currentRequest = null;
    let currentParamTab = 'query';
    let currentResponseTab = 'preview';

    // Theme Setup
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (themeToggle) {
        themeToggle.checked = currentTheme === 'dark';
        themeToggle.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const section = this.dataset.section;
            sections.forEach(s => s.classList.add('hidden'));
            
            const activeSection = document.getElementById(`${section}-section`);
            if (activeSection) activeSection.classList.remove('hidden');
            
            currentSectionTitle.textContent = this.querySelector('span').textContent;
            
            // Update section description
            const descriptions = {
                dashboard: 'Beta APIs Yang Akan Terus Dikembangkan.',
                endpoints: 'Jelajahi API yang tersedia',
                documentation: 'Api Dengan Real-Time'
            };
            
            if (sectionDescription) {
                sectionDescription.textContent = descriptions[section] || '';
            }
        });
    });

    // Fetch API Info
    fetch('/api/info')
        .then(response => response.json())
        .then(data => {
            endpoints = data.endpoints;
            
            if (endpointCount) {
                endpointCount.textContent = endpoints.length;
            }
            
            renderEndpoints(endpoints);
            
            // Sample API calls
            logActivity('GET', '/download/fb?url=https://facebook.com/video123');
            logActivity('POST', '/tobase64', { text: 'Hello World' });
        })
        .catch(error => {
            console.error('API Load Error:', error);
            if (endpointsContainer) {
                endpointsContainer.innerHTML = '<div class="error-message">Gagal memuat data endpoint.</div>';
            }
        });

    // Filter Buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            const filteredEndpoints = filter === 'all' 
                ? endpoints 
                : endpoints.filter(ep => ep.status.toLowerCase() === filter);
            
            renderEndpoints(filteredEndpoints);
        });
    });

    // Search Functionality
    if (endpointSearch) {
        endpointSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filtered = endpoints.filter(ep => 
                ep.name.toLowerCase().includes(searchTerm) || 
                ep.path.toLowerCase().includes(searchTerm) || 
                ep.desc.toLowerCase().includes(searchTerm)
            );
            
            renderEndpoints(filtered);
        });
    }

    // Parameter Tabs
    paramTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            paramTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            currentParamTab = this.dataset.tab;
            paramsContents.forEach(content => content.classList.add('hidden'));
            
            const activeContent = document.getElementById(`${currentParamTab}-params`);
            if (activeContent) activeContent.classList.remove('hidden');
        });
    });

    // Response Tabs
    responseTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            responseTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            currentResponseTab = this.dataset.tab;
            responsePreviews.forEach(preview => preview.classList.add('hidden'));
            
            if (currentResponseTab === 'preview') {
                responsePreview.classList.remove('hidden');
            } else if (currentResponseTab === 'raw') {
                responseRaw.classList.remove('hidden');
            } else {
                responseHeaders.classList.remove('hidden');
            }
        });
    });

    // Send Request
    if (sendRequest) {
        sendRequest.addEventListener('click', function() {
            const method = httpMethod?.value || 'GET';
            let path = endpointPath?.value || '';
            
            if (!path) return;
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = requestBody?.value || '{}';
            }
            
            responseStatus.textContent = 'Mengirim...';
            
            fetch(path, options)
                .then(response => response.json()
                    .then(data => ({
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        body: data
                    }))
                )
                .then(data => {
                    responseStatus.textContent = `${data.status} ${data.statusText}`;
                    responsePreview.textContent = JSON.stringify(data.body, null, 2);
                    responseRaw.textContent = JSON.stringify(data.body, null, 2);
                    
                    const headers = {};
                    data.headers.forEach((value, key) => headers[key] = value);
                    responseHeaders.textContent = JSON.stringify(headers, null, 2);
                    
                    logActivity(method, path);
                })
                .catch(error => handleError(error.message));
        });
    }

    // Helper Functions
    function handleError(message) {
        responseStatus.textContent = `Error: ${message}`;
        responseStatus.style.color = '#f44336';
        responsePreview.textContent = `{"error":"${message}"}`;
        responseRaw.textContent = responsePreview.textContent;
        responseHeaders.textContent = '{}';
    }

    function logActivity(method, path, body) {
        if (!activityFeed) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const iconType = method === 'GET' ? 'download' : 'upload';
        const methodClass = method === 'GET' ? 'get-method' : 'post-method';
        
        activityItem.innerHTML = `
            <div class="activity-icon"><i class="fas fa-${iconType}"></i></div>
            <div class="activity-content">
                <div>
                    <span class="activity-method ${methodClass}">${method}</span>
                    <span class="activity-path">${path}</span>
                </div>
                <div class="activity-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        if (activityFeed.firstChild) {
            activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        } else {
            activityFeed.appendChild(activityItem);
        }
        
        if (activityFeed.children.length > 10) {
            activityFeed.removeChild(activityFeed.lastChild);
        }
    }

    function renderEndpoints(endpointsList) {
        if (!endpointsContainer) return;
        
        endpointsContainer.innerHTML = '';
        
        if (endpointsList.length === 0) {
            endpointsContainer.innerHTML = '<div class="empty-state">Tidak ada endpoint ditemukan.</div>';
            return;
        }
        
        endpointsList.forEach(endpoint => {
            const endpointCard = document.createElement('div');
            endpointCard.className = `endpoint-card ${endpoint.status.toLowerCase()}`;
            
            const paramsHTML = endpoint.params 
                ? `<div class="endpoint-params">
                    <h4>Parameters:</h4>
                    ${Object.entries(endpoint.params).map(([name, desc]) => `
                        <div class="param-item">
                            <span class="param-name">${name}:</span>
                            <span class="param-desc">${desc}</span>
                        </div>
                    `).join('')}
                   </div>`
                : '';
            
            endpointCard.innerHTML = `
                <div class="endpoint-header">
                    <div class="endpoint-name">${endpoint.name}</div>
                    <div class="endpoint-status status-${endpoint.status.toLowerCase()}">${endpoint.status}</div>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">${endpoint.desc}</div>
                    <div class="endpoint-path">${endpoint.path}</div>
                    ${paramsHTML}
                </div>
                <div class="endpoint-footer">
                    <button class="try-btn" data-path="${endpoint.path}">
                        <i class="fas fa-flask"></i> Coba
                    </button>
                    <button class="copy-btn" onclick="navigator.clipboard.writeText('${endpoint.path}').then(() => alert('Endpoint disalin!'))">
                        <i class="fas fa-copy"></i> Salin
                    </button>
                </div>
            `;
            
            endpointsContainer.appendChild(endpointCard);
        });
        
        // Add event listeners to try buttons
        document.querySelectorAll('.try-btn').forEach(button => {
            button.addEventListener('click', function() {
                const path = this.dataset.path;
                if (endpointPath) endpointPath.value = path;
                
                const docNavItem = document.querySelector('.nav-item[data-section="documentation"]');
                if (docNavItem) docNavItem.click();
            });
        });
    }

    function copyResponse() {
        const text = document.getElementById("response-preview").innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert("Response berhasil disalin!");
        });
    }

    // Initialize copy response button
    document.getElementById("send-request")?.insertAdjacentHTML(
        "afterend",
        '<button class="copy-btn" onclick="copyResponse()"><i class="fas fa-copy"></i> Salin Response</button>'
    );

    // Initialize default section
    (function(initialSection) {
        const defaultNavItem = document.querySelector(`.nav-item[data-section="${initialSection}"]`);
        if (defaultNavItem) defaultNavItem.click();
    })('dashboard');
});