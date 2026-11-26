
# 📁 FileVault Pro

### A Modern File Sharing and Management Platform

FileVault Pro is a web-based file management application developed using React and Vite. It allows users to upload, organize, manage, preview and download files through a simple and user-friendly dashboard.

## 🚀 Project Overview

The main aim of FileVault Pro is to provide a convenient digital workspace where users can manage their files efficiently.

The application provides a login and registration system, file upload functionality, folder organization, file searching and a responsive dashboard.

## 🎯 Objectives

- Develop a user-friendly file management platform.
- Implement user registration and login.
- Allow users to upload and manage multiple files.
- Organize files using folders.
- Provide file preview and download options.
- Implement search, filter and sorting features.
- Provide a responsive interface for different devices.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Development server and build tool |
| JavaScript | Application functionality |
| HTML5 | Webpage structure |
| CSS3 | Styling and responsive design |
| React Router DOM | Page navigation |
| Local Storage | Demo user authentication |
| IndexedDB | Local file storage |

## ✨ Features

### 1. User Authentication
- User registration.
- User login.
- Form validation.
- Logout functionality.

### 2. Dashboard
- Professional dashboard interface.
- Total file statistics.
- Folder statistics.
- Storage usage display.

### 3. File Management
- Upload multiple files.
- Drag-and-drop file upload.
- Preview supported files.
- Download files.
- Search files.
- Filter and sort files.
- Mark files as starred.
- Move files to Trash.
- Restore deleted files.

### 4. Folder Management
- Create folders.
- View available folders.
- Organize files.

### 5. Additional Features
- Dark mode.
- Notifications panel.
- Responsive user interface.
- 404 error page.

## 📂 Project Structure

```text
FileVault-Pro/
│
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── README.md
│
├── main.jsx
├── App.jsx
├── Login.jsx
├── Signup.jsx
├── Dashboard.jsx
├── NotFound.jsx
├── Navbar.jsx
├── Sidebar.jsx
└── style.css
```

## ⚙️ Installation and Setup

### Step 1: Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_LINK
```

### Step 2: Open the project folder

```bash
cd FileVault-Pro
```

### Step 3: Install dependencies

```bash
npm install
```

### Step 4: Start the development server

```bash
npm run dev
```

### Step 5: Open in browser

```text
http://localhost:5173/
```

## 🌐 Deployment

The application can be deployed using Vercel.

1. Upload the project to GitHub.
2. Connect the GitHub repository to Vercel.
3. Select Vite as the framework.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Click Deploy.

## 💾 Data Storage

This project currently uses browser-based storage:

- Local Storage for demo user account information.
- IndexedDB for uploaded files.
- Local Storage for folder and interface preferences.

Data is stored in the user's browser and is not automatically synchronized across devices.

## 🔮 Future Enhancements

- Backend integration.
- Secure password hashing and authentication.
- Cloud-based file storage.
- Real file-sharing links.
- User access permissions.
- File version control.
- Large file upload support.
- Email notifications.

## 👨‍💻 Project Information

**Project Name:** FileVault Pro

**Project Type:** Web Application

**Frontend:** React + Vite

**Deployment Platform:** Vercel

---

⭐ If you find this project useful, consider giving it a star!
