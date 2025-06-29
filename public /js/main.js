document.addEventListener('DOMContentLoaded', function() {
    const convertBtn = document.getElementById('convertBtn');
    const inputText = document.getElementById('inputText');
    const result = document.getElementById('result');

    convertBtn.addEventListener('click', async function() {
        if (!inputText.value.trim()) {
            alert('Please enter some text to convert');
            return;
        }

        try {
            const response = await fetch('/api/v1/tobase64', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText.value })
            });

            const data = await response.json();

            if (response.ok) {
                result.value = data.base64;
            } else {
                throw new Error(data.error || 'Conversion failed');
            }
        } catch (error) {
            result.value = `Error: ${error.message}`;
        }
    });
});