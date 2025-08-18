#!/bin/bash

echo "Setting up Instagram Clone project..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install
cd frontend && npm install && cd ..

# Setup Python virtual environment for backend
echo "Setting up Python virtual environment..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing backend dependencies..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # macOS/Linux
    source venv/bin/activate
fi

pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

cd ..

echo "Setup complete!"
echo ""
echo "To run the project:"
echo "  npm run dev"
echo ""
echo "This will start both frontend (http://localhost:5173) and backend (http://localhost:8000)"