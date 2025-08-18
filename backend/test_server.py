from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Instagram Clone API Test")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Instagram Clone API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/auth/register")
def register(email: str, username: str, password: str):
    return {"message": "User created", "username": username}

@app.post("/api/auth/login")
def login(email: str, password: str):
    return {
        "access_token": "test-token",
        "refresh_token": "test-refresh",
        "token_type": "bearer",
        "user": {"username": "test", "email": email}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)