# Resend Client

A modern desktop email client built with **Wails**, powered by the **Resend API**.

## Features

- 📧 **Rich Email Support**: Compose and send emails with support for both HTML and Plain Text formats.
- 📝 **Send History**: Automatically track and manage your entire email dispatch history.
- 🔐 **Secure Storage**: Your Resend API Key is stored locally and protected by **AES-256 encryption**.
- 🎨 **Modern Interface**: A clean, sleek, and intuitive dark-themed UI.
- 💾 **Privacy First**: All data is stored exclusively on your local machine to ensure maximum privacy.

## Getting Started

### Prerequisites

- **Go**: 1.18 or higher
- **Node.js**: 16 or higher
- **pnpm**: Recommended package manager
- **Wails CLI**: Install via `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Installation

```bash
# Install frontend dependencies
cd frontend
pnpm install
cd ..
```

### Development

Run the application in development mode with hot-reloading:

```bash
wails dev
```

### Build

Compile the production-ready application:

```bash
wails build
```

## Resend Configuration

1. Sign up for an account at [resend.com](https://resend.com).
2. Create a new **API Key** in the dashboard.
3. Verify your **Sending Domain**.
4. Configure your API Key in the application's **Settings** page.

## Usage Guide

### Sending Emails
1. Navigate to the **Compose** page.
2. Ensure the "From" address uses a domain you have verified in Resend.
3. Supports multiple recipients (separated by commas).
4. You can provide both HTML and Plain Text content for better email compatibility.
5. Click **Send Email** to dispatch.

### History Management
- View all sent records in the **History** page.
- Track sender/recipient details, subject lines, and timestamps.
- Options available to clear history logs.

### Data & Security
- **Config Path**: `~/.resend-client/config.enc`
- **Encryption**: All sensitive data is encrypted using **AES-256-GCM**.
- **Retention**: Locally stores up to 100 recent sent records.

## Tech Stack

- **Backend**: Go + Wails
- **Frontend**: React + TypeScript + Vite
- **UI/Styles**: Custom CSS (Modern Dark Theme)
- **Icons**: Lucide React
- **Cryptography**: AES-256-GCM

## License

This project is licensed under the [MIT License](LICENSE).
