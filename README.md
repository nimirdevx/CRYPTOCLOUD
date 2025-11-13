# 🔐 CryptoCloud

A modern, secure file storage application with zero-knowledge client-side encryption and a beautiful, animated UI.

## About The Project

CryptoCloud is a full-stack web application that provides secure file storage with end-to-end encryption. All files are encrypted on your device (client-side) before being uploaded to the server, ensuring that nobody—not even server administrators—can access your files.

**Backend:** Built with FastAPI, providing a robust RESTful API
**Frontend:** Built with Next.js 16, React 19, and Tailwind CSS v4

### ✨ Key Features

#### Security & Privacy

- **🔒 Zero-Knowledge Encryption:** All files are encrypted client-side before upload using AES-256-GCM
- **🔐 Secure Authentication:** JWT-based authentication with optional 2FA (TOTP) support
- **🛡️ Session Lock:** Automatic session locking with password re-entry requirement
- **🗝️ Master Password:** Your encryption keys never leave your device

#### User Experience

- **🎨 Modern UI:** Smooth animations, glass morphism effects, and polished interactions
- **⚡ Fast & Responsive:** Optimized loading states with skeleton loaders
- **🎭 Visual Hierarchy:** Color-coded file type icons and intuitive layouts
- **📱 Mobile Friendly:** Responsive design that works on all devices

#### File Management

- **📤 Drag & Drop Upload:** Easy file uploads with progress indicators
- **📥 Secure Download:** Automatic client-side decryption
- **🗂️ File Organization:** View, search, and manage your encrypted files
- **🎯 File Type Icons:** Visual indicators for images, PDFs, documents, archives, and videos

## 🚀 Getting Started

These instructions will get you up and running on your local machine for development and testing.

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 18+** (for frontend)
- **npm or yarn** (package manager)

### Installation

1.  **Clone the repository**

    ```sh
    git clone https://github.com/nimirdevx/CRYPTOCLOUD.git
    cd CRYPTOCLOUD
    ```

2.  **Backend Setup**

    ```sh
    cd backend
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    ```

    The backend API will be available at `http://127.0.0.1:8000`

3.  **Frontend Setup** (in a new terminal)

    ```sh
    cd frontend
    npm install
    npm run dev
    ```

    The frontend will be available at `http://localhost:3000`

## 📚 API Documentation (Swagger UI)

Once the backend server is running, you can access the interactive API documentation:

- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## 🎨 UI Features

The frontend has been enhanced with modern design patterns:

### Animations & Visual Effects

- **Animated Gradients:** Dynamic background gradients with smooth transitions
- **Floating Orbs:** Subtle animated orbs on key pages for visual depth
- **Glass Morphism:** Frosted glass effects on cards and containers
- **Slide-in Animations:** Staggered animations for lists and content
- **Pulse Effects:** Attention-grabbing animations on important elements

### Loading States

- **Skeleton Loaders:** Smooth loading placeholders for file lists and cards
- **Progress Indicators:** Real-time upload/download progress bars
- **Loading Spinners:** Configurable spinners with multiple color themes
- **Transition States:** Smooth transitions between loading and loaded states

### Interactive Elements

- **Password Visibility Toggle:** Easy password reveal/hide on all auth forms
- **File Type Icons:** Color-coded icons for different file types
- **Hover Effects:** Interactive feedback on buttons, cards, and file items
- **Status Badges:** Visual indicators for 2FA status and account state

## 🛠️ Technology Stack

### Backend

- **FastAPI:** High-performance Python web framework
- **SQLite:** Lightweight database for user and file metadata
- **Pydantic:** Data validation and settings management
- **PyJWT:** JSON Web Token implementation
- **PyOTP:** Two-factor authentication (TOTP)

### Frontend

- **Next.js 16:** React framework with App Router
- **React 19:** Latest React with improved hooks and performance
- **Tailwind CSS v4:** Utility-first CSS framework
- **TypeScript:** Type-safe JavaScript
- **Web Crypto API:** Browser-native encryption/decryption

## 🔒 Security Architecture

### Client-Side Encryption Flow

1. **Key Derivation:** User's password is used to derive encryption keys using PBKDF2
2. **File Encryption:** Files are encrypted using AES-256-GCM before upload
3. **Zero-Knowledge:** Server only stores encrypted data and cannot decrypt files
4. **Secure Decryption:** Files are decrypted client-side after download

### Authentication & Session Management

- **JWT Tokens:** Secure token-based authentication
- **2FA Support:** Optional TOTP-based two-factor authentication
- **Session Lock:** Automatic session locking for enhanced security
- **Password Re-entry:** Periodic password verification for sensitive operations

## 📁 Project Structure

```
cryptocloud/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Utility functions (auth, crypto)
│   │   ├── config.py       # Configuration
│   │   ├── db.py          # Database setup
│   │   └── main.py        # Application entry point
│   ├── tests/             # Backend tests
│   └── requirements.txt   # Python dependencies
│
└── frontend/              # Next.js frontend
    ├── app/
    │   ├── auth/          # Authentication pages (login, register)
    │   ├── dashboard/     # Dashboard and file management
    │   ├── components/    # Reusable React components
    │   ├── context/       # React context providers
    │   ├── lib/           # Utility libraries (crypto)
    │   └── globals.css    # Global styles and animations
    └── package.json       # Node.js dependencies
```

## 🎯 Usage

### Creating an Account

1. Navigate to `http://localhost:3000`
2. Click "Get Started" or "Register"
3. Enter your email and create a strong password
4. Your encryption keys are automatically generated from your password

### Uploading Files

1. Log in to your account
2. Click "Upload File" on the dashboard
3. Select a file (drag & drop also supported)
4. File is encrypted and uploaded automatically
5. View your encrypted file in the file list

### Enabling 2FA (Recommended)

1. Go to Dashboard → Security Settings
2. Click "Enable 2FA"
3. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
4. Enter the verification code
5. Save your backup codes in a secure location

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FastAPI for the excellent backend framework
- Next.js team for the powerful React framework
- Tailwind CSS for the utility-first CSS framework
- The open-source community for inspiration and tools

## ⚠️ Security Notice

While CryptoCloud implements strong client-side encryption, please remember:

- **Keep your password secure:** Your password is the key to your encrypted files
- **Enable 2FA:** Add an extra layer of security to your account
- **Backup important files:** Always maintain local backups of critical data
- **Use strong passwords:** Choose complex, unique passwords for your account

## 📧 Contact

Project Link: [https://github.com/nimirdevx/CRYPTOCLOUD](https://github.com/nimirdevx/CRYPTOCLOUD)

---

Made with ❤️ for privacy and security
