document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const executeBtn = document.getElementById('execute-btn');
    const requestEditor = document.getElementById('request-editor');
    const responseOutput = document.getElementById('response-output');
    const endpointUrl = document.getElementById('endpoint-url');
    const copyEndpointBtn = document.getElementById('copy-endpoint');
    const copyResponseBtn = document.getElementById('copy-response');
    const requestTab = document.querySelectorAll('.tab-btn')[0];
    const responseTab = document.querySelectorAll('.tab-btn')[1];
    const requestPane = document.querySelector('.request-pane');
    const responsePane = document.querySelector('.response-pane');

    // Set current endpoint URL
    endpointUrl.textContent = `${window.location.origin}/api/tools/tobase64`;

    // Tab switching
    requestTab.addEventListener('click', () => {
        requestTab.classList.add('active');
        responseTab.classList.remove('active');
        requestPane.classList.add('active');
        responsePane.classList.remove('active');
    });

    responseTab.addEventListener('click', () => {
        responseTab.classList.add('active');
        requestTab.classList.remove('active');
        responsePane.classList.add('active');
        requestPane.classList.remove('active');
    });

    // Execute API request
    executeBtn.addEventListener('click', async () => {
        try {
            // Parse JSON input
            let requestBody;
            try {
                requestBody = JSON.parse(requestEditor.textContent);
            } catch (e) {
                throw new Error('Invalid JSON format');
            }

            if (!requestBody.text) {
                throw new Error('"text" field is required');
            }

            // Show loading state
            executeBtn.disabled = true;
            executeBtn.innerHTML = '<span>Sending...</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';

            const startTime = performance.now();
            
            // Make API request
            const response = await fetch('/api/tools/tobase64', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const responseTime = Math.round(performance.now() - startTime);
            
            const data = await response.json();

            // Display response
            responseOutput.textContent = JSON.stringify(data, null, 2);
            document.querySelector('.status-code code').textContent = response.status;
            document.querySelector('.response-time code').textContent = `${responseTime}ms`;
            
            // Switch to response tab
            responseTab.click();
        } catch (error) {
            responseOutput.textContent = JSON.stringify({
                error: error.message,
                status: 400
            }, null, 2);
            document.querySelector('.status-code code').textContent = '400';
            document.querySelector('.status-code code').style.color = 'var(--error-color)';
            responseTab.click();
        } finally {
            executeBtn.disabled = false;
            executeBtn.innerHTML = '<span>Send Request</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
    });

    // Copy functionality
    copyEndpointBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(endpointUrl.textContent);
        showTooltip(copyEndpointBtn, 'Copied!');
    });

    copyResponseBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(responseOutput.textContent);
        showTooltip(copyResponseBtn, 'Copied!');
    });

    function showTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'var(--surface-color)';
        tooltip.style.color = 'var(--text-primary)';
        tooltip.style.padding = '0.25rem 0.5rem';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '0.75rem';
        tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        tooltip.style.zIndex = '100';
        tooltip.style.transform = 'translateY(-100%)';
        
        element.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }, 1500);
    }

    // Add animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
});