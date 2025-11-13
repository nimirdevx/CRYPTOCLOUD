# CryptoCloud - Backend

A secure file storage application with client-side encryption. This README focuses on the backend API.

## About The Project

CryptoCloud is a web application that allows you to upload and store your files securely. The main feature of CryptoCloud is that all your files are encrypted on your device (client-side) before they are uploaded to the server. This means that nobody, not even the server administrators, can access your files.

The backend is built with FastAPI and provides a RESTful API for user authentication and file management.

### Features

- **Client-side encryption:** The backend is designed to work with a client that performs encryption before uploading.
- **Secure user authentication:** User accounts are protected with JWT authentication.
- **File management:** API endpoints for uploading, downloading, and deleting encrypted files.
- **API Documentation:** Interactive API documentation with Swagger UI.

## Getting Started

These instructions will get you the backend server up and running on your local machine for development and testing purposes.

### Prerequisites

- Python 3.8+

### Installation

1.  **Clone the repo**

    ```sh
    git clone https://github.com/nimirdevx/CRYPTOCLOUD.git
    cd CRYPTOCLOUD
    ```

2.  **Backend Setup**
    ```sh
    cd backend
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    ```

## API Documentation (Swagger UI)

Once the server is running, you can access the interactive API documentation in your browser. This is the best way to explore and test the API endpoints.

- **API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative API Docs:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
