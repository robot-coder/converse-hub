// frontend.js

// This script manages the front-end interactions for the web-based Chat Assistant.
// It handles user input, communicates with the back-end API, manages conversation state,
// supports file uploads, and allows model comparison.

const apiBaseUrl = 'https://your-render-deployment-url.com/api'; // Replace with your actual API URL

/**
 * Sends a message to the chat API and returns the response.
 * @param {string} message - The user's message.
 * @param {string} model - The selected language model.
 * @param {Array} conversationHistory - The current conversation history.
 * @returns {Promise<string>} - The assistant's reply.
 */
async function sendMessage(message, model, conversationHistory) {
    try {
        const response = await fetch(`${apiBaseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                model,
                conversation: conversationHistory
            })
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error('Error sending message:', error);
        return 'Sorry, there was an error processing your request.';
    }
}

/**
 * Uploads a file to the server.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} - The server response or file URL.
 */
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch(`${apiBaseUrl}/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.file_url; // Assuming server returns the uploaded file URL
    } catch (error) {
        console.error('File upload error:', error);
        return '';
    }
}

/**
 * Initializes the chat UI and event listeners.
 */
function initializeChat() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatContainer = document.getElementById('chatContainer');
    const modelSelect = document.getElementById('modelSelect');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const compareButton = document.getElementById('compareButton');

    let conversationHistory = [];
    let currentModel = modelSelect.value;

    // Update current model when selection changes
    modelSelect.addEventListener('change', () => {
        currentModel = modelSelect.value;
        // Optionally, reset conversation history on model change
        conversationHistory = [];
        chatContainer.innerHTML = '';
    });

    // Send message on button click
    sendButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) return;

        appendMessage('User', message);
        messageInput.value = '';

        const reply = await sendMessage(message, currentModel, conversationHistory);
        appendMessage('Assistant', reply);
        conversationHistory.push({ role: 'user', content: message });
        conversationHistory.push({ role: 'assistant', content: reply });
    });

    // Send message on Enter key press
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    // Handle file upload
    uploadButton.addEventListener('click', async () => {
        const files = fileInput.files;
        if (files.length === 0) return;

        for (const file of files) {
            const fileUrl = await uploadFile(file);
            if (fileUrl) {
                appendMessage('System', `File uploaded: ${file.name}`);
                // Optionally, send a message to the chat about the uploaded file
                const systemMessage = `I have uploaded the file: ${file.name}`;
                appendMessage('User', systemMessage);
                conversationHistory.push({ role: 'user', content: systemMessage });
            } else {
                appendMessage('System', `Failed to upload: ${file.name}`);
            }
        }
        fileInput.value = '';
    });

    // Handle model comparison
    compareButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) return;

        // Send to multiple models for comparison
        const modelsToCompare = ['modelA', 'modelB']; // Replace with actual model names
        const responses = await Promise.all(modelsToCompare.map(model => sendMessage(message, model, conversationHistory)));

        // Display comparison
        displayComparison(modelsToCompare, responses);
    });

    /**
     * Appends a message to the chat container.
     * @param {string} sender - 'User', 'Assistant', or 'System'.
     * @param {string} message - The message content.
     */
    function appendMessage(sender, message) {
        const messageElem = document.createElement('div');
        messageElem.className = `message ${sender.toLowerCase()}`;
        messageElem.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatContainer.appendChild(messageElem);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Displays a comparison of responses from different models.
     * @param {Array<string>} models - List of model names.
     * @param {Array<string>} responses - Corresponding responses.
     */
    function displayComparison(models, responses) {
        const comparisonContainer = document.getElementById('comparisonContainer');
        comparisonContainer.innerHTML = ''; // Clear previous comparison

        models.forEach((model, index) => {
            const modelDiv = document.createElement('div');
            modelDiv.className = 'model-response';
            modelDiv.innerHTML = `<h4>${model}</h4><p>${responses[index]}</p>`;
            comparisonContainer.appendChild(modelDiv);
        });
    }
}

// Initialize the chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeChat);