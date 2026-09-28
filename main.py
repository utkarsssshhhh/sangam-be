import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# Load environment variables
load_dotenv()

app = FastAPI(title="LangChain Chatbot API")

# Allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for request and response
class Message(BaseModel):
    role: str # 'user', 'bot', or 'system'
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@app.get("/")
def root():
    return {"status": "ok", "message": "Chatbot API is running"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not os.environ.get("GROQ_API_KEY") or os.environ.get("GROQ_API_KEY") == "your_new_api_key_here":
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set correctly in the backend .env file.")

    try:
        chat = ChatGroq(model="openai/gpt-oss-120b", streaming=True)
        
        # Convert incoming JSON messages to LangChain message objects
        langchain_messages = []
        
        # Always start with a system message if not provided
        has_system = any(m.role == "system" for m in request.messages)
        if not has_system:
            langchain_messages.append(SystemMessage(content="You are a helpful, smart, and friendly assistant."))
            
        for msg in request.messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "bot":
                langchain_messages.append(AIMessage(content=msg.content))
            elif msg.role == "system":
                langchain_messages.append(SystemMessage(content=msg.content))

        # Generator function for streaming response
        async def generate():
            async for chunk in chat.astream(langchain_messages):
                if chunk.content:
                    # Depending on how it chunk.content is typed, ensure it's string
                    yield str(chunk.content)
                    
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        print(f"Error during chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
