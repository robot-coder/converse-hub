# README.md

# Web-Based Chat Assistant

This project implements a web-based Chat Assistant that provides a user-friendly interface for continuous, themed conversations with selectable Large Language Models (LLMs). It features file uploads, model comparison, and is deployed on Render.com for scalable access.

## Features

- Interactive chat UI for real-time conversations
- Support for multiple LLMs with theme-based conversations
- File upload capability for context or data
- Model comparison to evaluate different LLMs
- Deployed on Render.com for reliable hosting

## Technologies Used

- FastAPI for the backend API
- Uvicorn as the ASGI server
- liteLLM for lightweight LLM integration
- httpx for HTTP requests
- starlette for web components
- pydantic for data validation

## Files

- `frontend.js`: Front-end JavaScript for UI interactions
- `server.py`: Backend API implementation
- `README.md`: This documentation

## Setup Instructions

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository:

```bash
git clone <repository_url>
cd <repository_directory>
```

2. Install dependencies:

```bash
pip install fastapi uvicorn liteLLM httpx starlette pydantic
```

### Running the Server

Start the backend server with:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

The server will be accessible at `http://localhost:8000`.

### Deployment

Deploy on Render.com by connecting your repository and configuring the service to run:

```bash
uvicorn server:app --host 0.0.0.0 --port 10000
```

## Usage

Open `frontend.html` in your browser (or serve the `frontend.js` with your preferred method). Interact with the chat interface to start themed conversations, upload files, or compare models.

## License

This project is licensed under the MIT License.

---

# Code Files

## frontend.js

```javascript
// frontend.js

/**
 * Front-end JavaScript for Chat Assistant UI interactions.
 */

const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const modelSelect = document.getElementById('model-select');
const themeSelect = document.getElementById('theme-select');
const compareButton = document.getElementById('compare-button');

const apiUrl = 'http://localhost:8000/api/chat';

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    appendMessage('User', message);
    messageInput.value = '';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                model: modelSelect.value,
                theme: themeSelect.value
            })
        });
        const data = await response.json();
        if (response.ok) {
            appendMessage('Assistant', data.reply);
        } else {
            appendMessage('Error', data.detail || 'Error occurred');
        }
    } catch (error) {
        appendMessage('Error', error.message);
    }
}

function appendMessage(sender, message) {
    const messageElem = document.createElement('div');
    messageElem.className = 'message ' + sender.toLowerCase();
    messageElem.innerText = `${sender}: ${message}`;
    chatContainer.appendChild(messageElem);
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            alert('File uploaded successfully');
        } else {
            alert('Upload failed: ' + data.detail);
        }
    } catch (error) {
        alert('Error uploading file: ' + error.message);
    }
});

compareButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/compare', {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            alert('Comparison results: ' + data.result);
        } else {
            alert('Comparison failed: ' + data.detail);
        }
    } catch (error) {
        alert('Error during comparison: ' + error.message);
    }
});
```

## server.py

```python
# server.py

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import uvicorn
import httpx
from liteLLM import LiteLLM

app = FastAPI()

# Initialize models (assuming liteLLM supports multiple models)
models = {
    "model_a": LiteLLM(model_name="model_a"),
    "model_b": LiteLLM(model_name="model_b")
}

# Store uploaded files in memory or save to disk as needed
uploaded_files = {}

class ChatRequest(BaseModel):
    message: str
    model: str
    theme: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    model_name = request.model
    message = request.message
    theme = request.theme

    if model_name not in models:
        raise HTTPException(status_code=400, detail="Model not supported")
    model_instance = models[model_name]

    # Optionally, incorporate theme or context
    prompt = f"Theme: {theme}\nUser: {message}"

    try:
        reply = await generate_reply(model_instance, prompt)
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_reply(model: LiteLLM, prompt: str) -> str:
    # Generate reply using liteLLM
    try:
        response = await model.chat(prompt)
        return response
    except Exception as e:
        raise e

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    uploaded_files[file.filename] = content
    return {"detail": f"File '{file.filename}' uploaded successfully"}

@app.post("/api/compare")
async def compare_models():
    # Placeholder for model comparison logic
    # For example, run a test prompt on each model and compare responses
    test_prompt = "Compare the capabilities of model_a and model_b."
    results = {}
    for name, model in models.items():
        try:
            reply = await model.chat(test_prompt)
            results[name] = reply
        except Exception as e:
            results[name] = f"Error: {str(e)}"
    # Simple comparison output
    comparison_result = "\n".join([f"{name}: {reply}" for name, reply in results.items()])
    return {"result": comparison_result}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
```