import uvicorn
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os

# Assuming liteLLM is a hypothetical library for interacting with LLMs
import liteLLM

app = FastAPI(title="Web-based Chat Assistant")

# Configuration: Replace with your actual model endpoints or API keys
MODEL_ENDPOINTS = {
    "model_a": "https://api.modela.com/v1/generate",
    "model_b": "https://api.modelb.com/v1/generate"
}

# In-memory storage for conversations (for simplicity)
conversations = {}

class Message(BaseModel):
    user_id: str
    message: str
    theme: Optional[str] = None
    model_choice: Optional[str] = "model_a"

class FileUploadResponse(BaseModel):
    filename: str
    message: str

@app.post("/chat/")
async def chat_endpoint(msg: Message):
    """
    Handle user message, generate response from selected LLM, maintain conversation context.
    """
    try:
        # Retrieve or initialize conversation history
        history = conversations.get(msg.user_id, [])
        # Append user message
        history.append({"role": "user", "content": msg.message})

        # Prepare prompt or context based on theme if needed
        prompt = "\n".join([entry["content"] for entry in history])

        # Call the LLM API
        response_text = await generate_response(prompt, model_name=msg.model_choice)

        # Append assistant response
        history.append({"role": "assistant", "content": response_text})
        conversations[msg.user_id] = history

        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_response(prompt: str, model_name: str = "model_a") -> str:
    """
    Generate a response from the specified LLM model.
    """
    try:
        endpoint = MODEL_ENDPOINTS.get(model_name)
        if not endpoint:
            raise ValueError(f"Model '{model_name}' not supported.")

        payload = {"prompt": prompt}
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()
            # Assuming the response contains a 'text' field
            return data.get("text", "")
    except httpx.HTTPError as e:
        raise RuntimeError(f"Error communicating with model API: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Error generating response: {str(e)}")

@app.post("/uploadfile/", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Handle file uploads from users.
    """
    try:
        save_path = os.path.join("uploads", file.filename)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        return FileUploadResponse(filename=file.filename, message="File uploaded successfully.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to the Web-based Chat Assistant API"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)