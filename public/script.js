document.addEventListener('DOMContentLoaded', function() {
    // Load API info
    fetch('/api/info')
        .then(response => response.json())
        .then(data => {
            document.getElementById('api-title').textContent = data.name;
            document.getElementById('api-description').textContent = data.description;
            
            // Populate endpoints list
            const endpointsList = document.getElementById('endpoints-list');
            const endpointSelect = document.getElementById('endpoint-select');
            
            data.endpoints.forEach(endpoint => {
                // Add to cards
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${endpoint.name}</h3>
                    <p>${endpoint.desc}</p>
                    <div class="path">${endpoint.path}</div>
                    <span class="status ${endpoint.status}">${endpoint.status}</span>
                `;
                endpointsList.appendChild(card);
                
                // Add to select dropdown
                const option = document.createElement('option');
                option.value = endpoint.path.split('?')[0];
                option.textContent = `${endpoint.name} (${endpoint.path})`;
                option.dataset.params = JSON.stringify(endpoint.params || {});
                endpointSelect.appendChild(option);
            });
            
            // Set up event listener for endpoint selection
            endpointSelect.addEventListener('change', function() {
                const paramsContainer = document.getElementById('params-container');
                paramsContainer.innerHTML = '';
                
                if (this.value) {
                    const selectedOption = this.options[this.selectedIndex];
                    const params = JSON.parse(selectedOption.dataset.params);
                    
                    for (const [param, desc] of Object.entries(params)) {
                        const paramDiv = document.createElement('div');
                        paramDiv.className = 'param-input';
                        paramDiv.innerHTML = `
                            <label for="param-${param}">${param} <small>(${desc})</small></label>
                            <input type="text" id="param-${param}" placeholder="${desc}">
                        `;
                        paramsContainer.appendChild(paramDiv);
                    }
                }
            });
            
            // Set up event listener for try button
            document.getElementById('try-button').addEventListener('click', function() {
                const endpointSelect = document.getElementById('endpoint-select');
                const selectedPath = endpointSelect.value;
                
                if (!selectedPath) {
                    alert('Please select an endpoint first');
                    return;
                }
                
                const paramsContainer = document.getElementById('params-container');
                const paramInputs = paramsContainer.querySelectorAll('input');
                const queryParams = [];
                
                paramInputs.forEach(input => {
                    const paramName = input.id.replace('param-', '');
                    if (input.value) {
                        queryParams.push(`${paramName}=${encodeURIComponent(input.value)}`);
                    }
                });
                
                const url = `${selectedPath}${queryParams.length ? '?' + queryParams.join('&') : ''}`;
                
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('response-output').textContent = JSON.stringify(data, null, 2);
                    })
                    .catch(error => {
                        document.getElementById('response-output').textContent = `Error: ${error.message}`;
                    });
            });
        })
        .catch(error => {
            console.error('Error loading API info:', error);
            document.getElementById('api-title').textContent = 'Error loading API';
        });
});