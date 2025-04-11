from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Correct CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ✅ React frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # ✅ Allow all headers
)

# Hugging Face API Key
HF_API_KEY = "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"
HF_MODEL = "mistralai/Mistral-Nemo-Instruct-2407"  # ✅ Your requested model

# Define request model
class ChatRequest(BaseModel):
    query: str  

@app.post("/chat")
def chat_with_model(request: ChatRequest):
    try:
        user_message = request.query

        # Request Payload
        payload = {
            "inputs": user_message,
            "parameters": {"max_length": 500}
        }

        # API Request to Hugging Face
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        response = requests.post(
            f"https://api-inference.huggingface.co/models/{HF_MODEL}",
            headers=headers,
            json=payload
        )

        # Check for Errors
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.json())

        # Extract Response
        bot_response = response.json()[0]['generated_text']
        return {"reply": bot_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run FastAPI Server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
