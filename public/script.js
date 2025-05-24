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

    // State
    let apiEndpoints = [];
    let currentEndpoint = null;
    let activeParamsTab = 'query';
    let activeResponseTab = 'preview';

    // Initialize theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.checked = currentTheme === 'dark';

    // Theme toggle
    themeToggle.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const section = this.dataset.section;
            sections.forEach(sec => sec.classList.add('hidden'));
            document.getElementById(`${section}-section`).classList.remove('hidden');
            
            // Update header
            currentSectionTitle.textContent = this.querySelector('span').textContent;
            
            // Update description
            updateSectionDescription(section);
        });
    });

    function updateSectionDescription(section) {
        const descriptions = {
            dashboard: 'Overview of your API services and recent activity',
            endpoints: 'Explore all available API endpoints',
            documentation: 'Test API endpoints in real-time'
        };
        sectionDescription.textContent = descriptions[section] || '';
    }

    // Load API data
    fetch('/api/info')
        .then(response => response.json())
        .then(data => {
            apiEndpoints = data.endpoints;
            
            // Update stats
            endpointCount.textContent = apiEndpoints.length;
            
            // Render endpoints
            renderEndpoints(apiEndpoints);
            populateEndpointSelector();
            
            // Add sample activity (in real app, this would come from server)
            addActivityItem('GET', '/download/fb?url=https://facebook.com/video123');
            addActivityItem('POST', '/tobase64', { text: 'Hello World' });
        })
        .catch(error => {
            console.error('Error loading API data:', error);
            endpointsContainer.innerHTML = `<div class="error-message">Failed to load endpoints. Please try again later.</div>`;
        });

    // Render endpoints
    function renderEndpoints(endpoints) {
        endpointsContainer.innerHTML = '';
        
        if (endpoints.length === 0) {
            endpointsContainer.innerHTML = `<div class="empty-state">No endpoints found matching your criteria.</div>`;
            return;
        }
        
        endpoints.forEach(endpoint => {
            const endpointCard = document.createElement('div');
            endpointCard.className = 'endpoint-card';
            
            const statusClass = `status-${endpoint.status.toLowerCase()}`;
            
            endpointCard.innerHTML = `
                <div class="endpoint-header">
                    <h3 class="endpoint-name">${endpoint.name}</h3>
                    <span class="endpoint-status ${statusClass}">${endpoint.status}</span>
                </div>
                <div class="endpoint-body">
                    <p class="endpoint-description">${endpoint.desc}</p>
                    <code class="endpoint-path">${endpoint.path}</code>
                    ${endpoint.params ? `
                    <div class="endpoint-params">
                        <h4>Parameters:</h4>
                        ${Object.entries(endpoint.params).map(([name, desc]) => `
                            <div class="param-item">
                                <span class="param-name">${name}:</span>
                                <span class="param-desc">${desc}</span>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
                <div class="endpoint-footer">
                    <button class="try-btn" data-path="${endpoint.path.split('?')[0]}">
                        <i class="fas fa-flask"></i> Try it out
                    </button>
                </div>
            `;
            
            endpointsContainer.appendChild(endpointCard);
        });
        
        // Add event listeners to try buttons
        document.querySelectorAll('.try-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Switch to documentation section
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelector('.nav-item[data-section="documentation"]').classList.add('active');
                sections.forEach(sec => sec.classList.add('hidden'));
                document.getElementById('documentation-section').classList.remove('hidden');
                currentSectionTitle.textContent = 'Documentation';
                sectionDescription.textContent = 'Test API endpoints in real-time';
                
                // Set the endpoint path
                const path = this.dataset.path;
                endpointPath.value = path;
                currentEndpoint = apiEndpoints.find(ep => ep.path.startsWith(path));
                
                // Update params
                updateParamsUI();
            });
        });
    }

    // Populate endpoint selector
    function populateEndpointSelector() {
        // This is handled by the endpoint cards' try buttons in this version
    }

    // Filter endpoints
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            let filteredEndpoints = apiEndpoints;
            
            if (filter !== 'all') {
                filteredEndpoints = apiEndpoints.filter(ep => 
                    filter === 'ready' ? ep.status === 'Ready' :
                    filter === 'beta' ? ep.status === 'Beta' :
                    ep.status === 'Maintenance'
                );
            }
            
            renderEndpoints(filteredEndpoints);
        });
    });

    // Search endpoints
    endpointSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredEndpoints = apiEndpoints.filter(ep => 
            ep.name.toLowerCase().includes(searchTerm) || 
            ep.desc.toLowerCase().includes(searchTerm) ||
            ep.path.toLowerCase().includes(searchTerm)
        );
        renderEndpoints(filteredEndpoints);
    });

    // Params tabs
    paramTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            paramTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            activeParamsTab = this.dataset.tab;
            paramsContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`${activeParamsTab}-params`).classList.remove('hidden');
        });
    });

    // Response tabs
    responseTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            responseTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            activeResponseTab = this.dataset.tab;
            responseContents.forEach(content => content.classList.add('hidden'));
            
            if (activeResponseTab === 'preview') {
                responsePreview.classList.remove('hidden');
            } else if (activeResponseTab === 'raw') {
                responseRaw.classList.remove('hidden');
            } else {
                responseHeaders.classList.remove('hidden');
            }
        });
    });

    // Update params UI based on selected endpoint
    function updateParamsUI() {
        queryParamsContainer.innerHTML = '';
        headersParamsContainer.innerHTML = '';
        
        if (currentEndpoint && currentEndpoint.params) {
            Object.entries(currentEndpoint.params).forEach(([param, desc]) => {
                const paramDiv = document.createElement('div');
                paramDiv.className = 'param-item';
                paramDiv.innerHTML = `
                    <label for="param-${param}">${param}</label>
                    <input type="text" id="param-${param}" placeholder="${desc}" class="param-input">
                `;
                queryParamsContainer.appendChild(paramDiv);
            });
        }
        
        // Add default headers
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        Object.entries(defaultHeaders).forEach(([header, value]) => {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'param-item';
            headerDiv.innerHTML = `
                <label for="header-${header.toLowerCase()}">${header}</label>
                <input type="text" id="header-${header.toLowerCase()}" value="${value}" class="param-input">
            `;
            headersParamsContainer.appendChild(headerDiv);
        });
    }

    // Send API request
    sendRequestBtn.addEventListener('click', function() {
        if (!endpointPath.value) {
            showResponseError('Please enter an endpoint path');
            return;
        }
        
        const method = httpMethod.value;
        const url = endpointPath.value;
        const params = {};
        
        // Get query params
        if (activeParamsTab === 'query' && currentEndpoint?.params) {
            Object.keys(currentEndpoint.params).forEach(param => {
                const value = document.getElementById(`param-${param}`)?.value;
                if (value) params[param] = value;
            });
        }
        
        // Get headers
        const headers = {};
        if (activeParamsTab === 'headers') {
            document.querySelectorAll('#headers-params .param-input').forEach(input => {
                const headerName = input.id.replace('header-', '');
                headers[headerName] = input.value;
            });
        }
        
        // Prepare request options
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        // Add body if needed
if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
        options.body = activeParamsTab === 'body' ? 
            requestBody.value : 
            JSON.stringify(params);
    } catch (e) {
        showResponseError('Invalid JSON body');
        return;
    }
}
        
        // Build URL with query params for GET requests
        let requestUrl = url;
        if (method === 'GET' && Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            requestUrl += `?${queryString}`;
        }
        
        // Show loading state
        responseStatus.textContent = 'Sending...';
        responseStatus.style.color = '';
        
        // Send request
        fetch(requestUrl, options)
            .then(async response => {
                const data = await response.json();
                const responseHeaders = {};
                
                // Convert headers to object
                response.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });
                
                // Update UI
                responseStatus.textContent = `${response.status} ${response.statusText}`;
                responseStatus.style.color = response.ok ? '#4cc9f0' : '#f72585';
                
                responsePreview.textContent = JSON.stringify(data, null, 2);
                responseRaw.textContent = JSON.stringify(data, null, 2);
                responseHeaders.textContent = JSON.stringify(responseHeaders, null, 2);
                
                // Add to activity feed
                addActivityItem(method, url, params);
            })
            .catch(error => {
                showResponseError(error.message);
            });
    });

    function showResponseError(message) {
        responseStatus.textContent = `Error: ${message}`;
        responseStatus.style.color = '#f72585';
        responsePreview.textContent = `{
    "error": "${message}"
}`;
        responseRaw.textContent = `{
    "error": "${message}"
}`;
        responseHeaders.textContent = '{}';
    }

    // Add activity item
    function addActivityItem(method, path, data) {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const methodClass = method.toLowerCase() === 'get' ? 'get-method' : 'post-method';
        
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${method.toLowerCase() === 'get' ? 'download' : 'upload'}"></i>
            </div>
            <div class="activity-content">
                <div>
                    <span class="activity-method ${methodClass}">${method}</span>
                    <span class="activity-path">${path}</span>
                </div>
                <div class="activity-time">${new Date().toLocaleString()}</div>
            </div>
        `;
        
        // Add to top of activity feed
        if (activityFeed.firstChild) {
            activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        } else {
            activityFeed.appendChild(activityItem);
        }
        
        // Limit to 10 items
        if (activityFeed.children.length > 10) {
            activityFeed.removeChild(activityFeed.lastChild);
        }
    }

    // Initialize
    updateSectionDescription('dashboard');
});