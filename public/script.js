document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const config = {
        apiBaseUrl: window.location.origin,
        environments: {
            production: window.location.origin,
            staging: window.location.origin.replace('production', 'staging'),
            development: 'http://localhost:3000'
        },
        defaultHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    // State management
    let state = {
        currentEnvironment: 'production',
        currentEndpoint: null,
        requestHistory: [],
        authToken: null
    };

    // DOM Elements
    const elements = {
        apiTitle: document.getElementById('api-title'),
        apiDescription: document.getElementById('api-description'),
        apiVersion: document.getElementById('api-version'),
        endpointsList: document.getElementById('endpoints-list'),
        endpointSelect: document.getElementById('endpoint-select'),
        paramsContainer: document.getElementById('params-container'),
        pathParamsContainer: document.getElementById('path-params-container'),
        headerParamsContainer: document.getElementById('header-params-container'),
        bodyParamsContainer: document.getElementById('body-params-container'),
        tryButton: document.getElementById('try-button'),
        responseOutput: document.getElementById('response-output'),
        responseStatus: document.getElementById('response-status'),
        responseTime: document.getElementById('response-time'),
        requestMethod: document.getElementById('request-method'),
        requestUrl: document.getElementById('request-url'),
        environmentSelect: document.getElementById('environment-select'),
        bodyContent: document.getElementById('body-content'),
        bodyType: document.getElementById('body-type'),
        codeExample: document.getElementById('code-example'),
        copyCodeBtn: document.getElementById('copy-code'),
        endpointSearch: document.getElementById('endpoint-search')
    };

    // Initialize the application
    init();

    function init() {
        loadApiInfo();
        setupEventListeners();
        setupTabs();
        setupParamTabs();
        setupResponseTabs();
        setupCodeTabs();
    }

    function loadApiInfo() {
        showLoadingState();
        
        fetch(`${config.apiBaseUrl}/api/info`)
            .then(handleResponse)
            .then(data => {
                updateApiInfo(data);
                populateEndpoints(data.endpoints);
                setupEndpointSearch(data.endpoints);
            })
            .catch(handleError);
    }

    function updateApiInfo(data) {
        elements.apiTitle.textContent = data.name || 'API Documentation';
        elements.apiDescription.textContent = data.description || '';
        if (data.version) {
            elements.apiVersion.textContent = `v${data.version}`;
        }
    }

    function populateEndpoints(endpoints) {
        elements.endpointsList.innerHTML = '';
        elements.endpointSelect.innerHTML = '<option value="">Select an endpoint</option>';
        
        endpoints.forEach(endpoint => {
            createEndpointCard(endpoint);
            createEndpointOption(endpoint);
        });
    }

    function createEndpointCard(endpoint) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.method = endpoint.method.toLowerCase();
        card.dataset.path = endpoint.path;
        
        card.innerHTML = `
            <h3>
                <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                ${endpoint.name}
            </h3>
            <p>${endpoint.description || endpoint.desc || 'No description available'}</p>
            <div class="path">${endpoint.path}</div>
            ${endpoint.status ? `<span class="status ${endpoint.status}">${endpoint.status}</span>` : ''}
            ${endpoint.authRequired ? '<span class="auth-badge"><i class="fas fa-lock"></i> Auth Required</span>' : ''}
        `;
        
        // Add click event to pre-select in dropdown
        card.addEventListener('click', () => {
            elements.endpointSelect.value = endpoint.path;
            elements.endpointSelect.dispatchEvent(new Event('change'));
            document.querySelector('.tab-btn[data-tab="try-it"]').click();
        });
        
        elements.endpointsList.appendChild(card);
    }

    function createEndpointOption(endpoint) {
        const option = document.createElement('option');
        option.value = endpoint.path;
        option.textContent = `${endpoint.method} ${endpoint.name} (${endpoint.path})`;
        option.dataset.endpoint = JSON.stringify(endpoint);
        elements.endpointSelect.appendChild(option);
    }

    function setupEndpointSearch(endpoints) {
        elements.endpointSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const cards = elements.endpointsList.querySelectorAll('.card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }

    function setupEventListeners() {
        // Endpoint selection
        elements.endpointSelect.addEventListener('change', handleEndpointSelection);
        
        // Try it out button
        elements.tryButton.addEventListener('click', sendRequest);
        
        // Environment change
        elements.environmentSelect.addEventListener('change', (e) => {
            state.currentEnvironment = e.target.value;
            updateRequestUrl();
        });
        
        // Body type change
        elements.bodyType.addEventListener('change', updateBodyInput);
        
        // Copy code button
        elements.copyCodeBtn.addEventListener('click', copyCodeToClipboard);
    }

    function handleEndpointSelection() {
        const selectedPath = this.value;
        
        if (!selectedPath) {
            clearParams();
            updateRequestUrl();
            updateCodeExample();
            return;
        }
        
        const selectedOption = this.options[this.selectedIndex];
        const endpoint = JSON.parse(selectedOption.dataset.endpoint);
        state.currentEndpoint = endpoint;
        
        // Update UI based on selected endpoint
        elements.requestMethod.textContent = endpoint.method;
        elements.requestMethod.className = `request-method ${endpoint.method.toLowerCase()}`;
        
        // Clear previous params
        clearParams();
        
        // Populate parameters
        if (endpoint.parameters) {
            populateParameters(endpoint.parameters);
        }
        
        updateRequestUrl();
        updateCodeExample();
    }

    function populateParameters(parameters) {
        // Path parameters
        if (parameters.path) {
            populateParamType(parameters.path, elements.pathParamsContainer, 'path');
        }
        
        // Query parameters
        if (parameters.query) {
            populateParamType(parameters.query, elements.paramsContainer, 'query');
        }
        
        // Header parameters
        if (parameters.header) {
            populateParamType(parameters.header, elements.headerParamsContainer, 'header');
            
            // Special handling for authorization
            const authParam = parameters.header.find(p => p.name.toLowerCase() === 'authorization');
            if (authParam && !state.authToken) {
                showAuthModal();
            }
        }
        
        // Body parameters
        if (parameters.body) {
            elements.bodyType.value = 'json';
            updateBodyInput();
        }
    }

    function populateParamType(params, container, type) {
        container.innerHTML = '';
        
        params.forEach(param => {
            const paramDiv = document.createElement('div');
            paramDiv.className = 'param-input';
            
            const inputId = `param-${type}-${param.name}`;
            let inputHtml = '';
            
            if (param.enum) {
                // Create dropdown for enum values
                inputHtml = `
                    <select id="${inputId}" ${param.required ? 'required' : ''}>
                        <option value="">Select ${param.name}</option>
                        ${param.enum.map(val => `<option value="${val}">${val}</option>`).join('')}
                    </select>
                `;
            } else {
                // Create text input
                const inputType = param.type === 'integer' ? 'number' : 'text';
                inputHtml = `
                    <input type="${inputType}" id="${inputId}" 
                           placeholder="${param.description || param.name}" 
                           ${param.required ? 'required' : ''}>
                `;
            }
            
            paramDiv.innerHTML = `
                <label for="${inputId}">
                    ${param.name}
                    ${param.required ? '<span class="required">*</span>' : ''}
                    <small>${param.description || ''}</small>
                </label>
                ${inputHtml}
            `;
            
            container.appendChild(paramDiv);
        });
    }

    function updateBodyInput() {
        const bodyType = elements.bodyType.value;
        const bodyParams = state.currentEndpoint?.parameters?.body || [];
        
        if (bodyType === 'json' && bodyParams.length > 0) {
            // Generate example JSON based on body parameters
            const exampleBody = {};
            bodyParams.forEach(param => {
                exampleBody[param.name] = param.example || 
                                         (param.type === 'string' ? 'string' : 
                                          param.type === 'integer' ? 0 : null);
            });
            
            elements.bodyContent.value = JSON.stringify(exampleBody, null, 2);
        } else if (bodyType === 'form-data') {
            // Generate form data example
            elements.bodyContent.value = bodyParams.map(param => 
                `${param.name}=${param.example || ''}`
            ).join('\n');
        } else {
            elements.bodyContent.value = '';
        }
    }

    function sendRequest() {
        if (!state.currentEndpoint) {
            showAlert('Please select an endpoint first', 'error');
            return;
        }
        
        const { method, path } = state.currentEndpoint;
        let url = buildRequestUrl();
        const options = {
            method,
            headers: { ...config.defaultHeaders }
        };
        
        // Add headers
        const headerInputs = elements.headerParamsContainer.querySelectorAll('input, select');
        headerInputs.forEach(input => {
            const headerName = input.id.replace('param-header-', '');
            if (input.value) {
                options.headers[headerName] = input.value;
            }
        });
        
        // Add auth token if available
        if (state.authToken) {
            options.headers['Authorization'] = `Bearer ${state.authToken}`;
        }
        
        // Handle request body
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            const bodyType = elements.bodyType.value;
            const bodyContent = elements.bodyContent.value;
            
            if (bodyType === 'json' && bodyContent) {
                try {
                    options.body = JSON.stringify(JSON.parse(bodyContent));
                } catch (e) {
                    showAlert('Invalid JSON format', 'error');
                    return;
                }
            } else if (bodyType === 'form-data' && bodyContent) {
                const formData = new FormData();
                bodyContent.split('\n').forEach(line => {
                    const [key, value] = line.split('=');
                    if (key && value) formData.append(key.trim(), value.trim());
                });
                options.body = formData;
                delete options.headers['Content-Type']; // Let browser set content-type with boundary
            } else if (bodyType === 'raw' && bodyContent) {
                options.body = bodyContent;
            }
        }
        
        // Show loading state
        elements.responseOutput.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Sending request...</div>';
        elements.tryButton.disabled = true;
        elements.tryButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Start request timer
        const startTime = performance.now();
        
        fetch(url, options)
            .then(async response => {
                const responseTime = performance.now() - startTime;
                const responseData = await parseResponse(response);
                
                // Update UI with response
                updateResponseUI(response, responseData, responseTime);
                
                // Add to history
                addToHistory({
                    method,
                    url,
                    request: options,
                    response: responseData,
                    status: response.status,
                    time: responseTime
                });
            })
            .catch(error => {
                const responseTime = performance.now() - startTime;
                elements.responseOutput.textContent = `Error: ${error.message}`;
                elements.responseStatus.textContent = `Status: Error`;
                elements.responseStatus.className = 'response-status error';
                elements.responseTime.textContent = `Time: ${Math.round(responseTime)}ms`;
            })
            .finally(() => {
                elements.tryButton.disabled = false;
                elements.tryButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
            });
    }

    function buildRequestUrl() {
        let url = `${config.environments[state.currentEnvironment]}${state.currentEndpoint.path}`;
        
        // Replace path parameters
        const pathInputs = elements.pathParamsContainer.querySelectorAll('input, select');
        pathInputs.forEach(input => {
            const paramName = input.id.replace('param-path-', '');
            if (input.value) {
                url = url.replace(`:${paramName}`, input.value);
            } else if (state.currentEndpoint.parameters.path.find(p => p.name === paramName && p.required)) {
                showAlert(`Path parameter ${paramName} is required`, 'error');
                throw new Error('Missing required path parameter');
            }
        });
        
        // Add query parameters
        const queryParams = [];
        const queryInputs = elements.paramsContainer.querySelectorAll('input, select');
        queryInputs.forEach(input => {
            const paramName = input.id.replace('param-query-', '');
            if (input.value) {
                queryParams.push(`${paramName}=${encodeURIComponent(input.value)}`);
            }
        });
        
        if (queryParams.length) {
            url += `?${queryParams.join('&')}`;
        }
        
        return url;
    }

    async function parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('text/')) {
            return await response.text();
        } else {
            return await response.blob();
        }
    }

    function updateResponseUI(response, data, responseTime) {
        // Format the response data
        let formattedResponse;
        if (typeof data === 'object') {
            formattedResponse = JSON.stringify(data, null, 2);
        } else {
            formattedResponse = data;
        }
        
        // Update response output
        elements.responseOutput.textContent = formattedResponse;
        
        // Highlight syntax if JSON
        if (typeof data === 'object') {
            hljs.highlightElement(elements.responseOutput);
        }
        
        // Update status and time
        elements.responseStatus.textContent = `Status: ${response.status} ${response.statusText}`;
        elements.responseStatus.className = `response-status ${response.ok ? 'success' : 'error'}`;
        elements.responseTime.textContent = `Time: ${Math.round(responseTime)}ms`;
    }

    function updateRequestUrl() {
        if (!state.currentEndpoint) {
            elements.requestUrl.textContent = `${config.environments[state.currentEnvironment]}/api`;
            return;
        }
        
        let url = `${config.environments[state.currentEnvironment]}${state.currentEndpoint.path}`;
        
        // Replace path parameters with sample values
        if (state.currentEndpoint.parameters?.path) {
            state.currentEndpoint.parameters.path.forEach(param => {
                url = url.replace(`:${param.name}`, param.example || `:${param.name}`);
            });
        }
        
        // Add sample query parameters
        if (state.currentEndpoint.parameters?.query) {
            const sampleParams = state.currentEndpoint.parameters.query
                .filter(param => param.example)
                .map(param => `${param.name}=${param.example}`);
            
            if (sampleParams.length) {
                url += `?${sampleParams.join('&')}`;
            }
        }
        
        elements.requestUrl.textContent = url;
    }

    function updateCodeExample() {
        if (!state.currentEndpoint) {
            elements.codeExample.textContent = '// Select an endpoint to see code examples';
            return;
        }
        
        const { method, path } = state.currentEndpoint;
        const baseUrl = config.environments[state.currentEnvironment];
        const fullUrl = `${baseUrl}${path}`;
        
        const examples = {
            javascript: `// Using fetch API
fetch('${fullUrl}', {
    method: '${method}',
    headers: {
        'Content-Type': 'application/json',
        ${state.authToken ? "'Authorization': 'Bearer YOUR_TOKEN'," : ""}
    },
    body: ${method === 'GET' ? 'undefined' : JSON.stringify({ key: 'value' }, null, 2)}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
            
            python: `# Using requests library
import requests

url = '${fullUrl}'
headers = {
    'Content-Type': 'application/json'${state.authToken ? ",\n    'Authorization': 'Bearer YOUR_TOKEN'" : ""}
}

response = requests.${method.toLowerCase()}(
    url,
    headers=headers,
    ${method === 'GET' ? '' : "json={'key': 'value'}"}
)

print(response.json())`,
            
            curl: `# Using cURL
curl -X ${method} \\
     '${fullUrl}' \\
     -H 'Content-Type: application/json' \\
     ${state.authToken ? "-H 'Authorization: Bearer YOUR_TOKEN' \\" : ""}
     ${method === 'GET' ? '' : "-d '{\"key\": \"value\"}'"}`,
            
            php: `<?php
// Using PHP cURL
$ch = curl_init('${fullUrl}');

$headers = [
    'Content-Type: application/json'${state.authToken ? ",\n    'Authorization: Bearer YOUR_TOKEN'" : ""}
];

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method}');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
${method === 'GET' ? '' : "curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['key' => 'value']));"}

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`
        };
 // Update the active code example
        const activeTab = document.querySelector('.code-tab.active');
        if (activeTab) {
            const language = activeTab.dataset.language;
            elements.codeExample.textContent = examples[language];
            elements.codeExample.className = `language-${language}`;
            hljs.highlightElement(elements.codeExample);
        }
    }

    function addToHistory(request) {
        state.requestHistory.unshift(request);
        if (state.requestHistory.length > 10) {
            state.requestHistory.pop();
        }
        // TODO: Update history UI if implemented
    }

    function clearParams() {
        elements.paramsContainer.innerHTML = '';
        elements.pathParamsContainer.innerHTML = '';
        elements.headerParamsContainer.innerHTML = '';
        elements.bodyContent.value = '';
    }

    function showLoadingState() {
        elements.apiTitle.textContent = 'Loading API...';
        elements.endpointsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    }

    function showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'times-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }

    function showAuthModal() {
        // TODO: Implement auth modal
        const token = prompt('Please enter your API token:');
        if (token) {
            state.authToken = token;
        }
    }

    function copyCodeToClipboard() {
        const code = elements.codeExample.textContent;
        navigator.clipboard.writeText(code)
            .then(() => {
                const originalText = elements.copyCodeBtn.innerHTML;
                elements.copyCodeBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    elements.copyCodeBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }

    function handleResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    function handleError(error) {
        console.error('Error:', error);
        elements.apiTitle.textContent = 'Error loading API';
        showAlert('Failed to load API documentation. Please try again later.', 'error');
    }

    // Tab functionality
    function setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.dataset.tab;
                document.getElementById(tabId).classList.add('active');
                
                // Update code examples if switching to examples tab
                if (tabId === 'examples') {
                    updateCodeExample();
                }
            });
        });
    }

    function setupParamTabs() {
        const tabs = document.querySelectorAll('.param-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all param tabs and contents
                document.querySelectorAll('.param-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.params-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.dataset.tab;
                document.querySelector(`.params-content[data-content="${tabId}"]`).classList.add('active');
            });
        });
    }

    function setupResponseTabs() {
        const tabs = document.querySelectorAll('.response-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all response tabs
                document.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                // TODO: Implement response tab content switching
            });
        });
    }

    function setupCodeTabs() {
        const tabs = document.querySelectorAll('.code-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all code tabs
                document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                updateCodeExample();
            });
        });
    }
});