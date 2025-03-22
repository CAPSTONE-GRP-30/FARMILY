# Project Setup Guide

## Getting Started

Welcome to Farmily! This README will guide you through setting up your development environment and getting started with contributing.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (recommended version: 16.x or later)
- A code editor (VS Code recommended)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application should now be running on `http://localhost:3000`

## Project Structure

```
├── public/          # Static assets
├── src/             # Source files
├── .gitignore       # Git ignore file
├── eslint.config.js # ESLint configuration
├── index.html       # Entry HTML file
├── package.json     # Project dependencies and scripts
├── postcss.config.js # PostCSS configuration
├── tailwind.config.js # Tailwind CSS configuration
├── vite.config.js   # Vite configuration
└── README.md        # This file
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Branching Strategy

1. Create a new branch for each feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   ```

3. Push your branch to the remote repository:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request on GitHub for review.

## Code Style and Conventions

This project uses:
- ESLint for code linting
- Tailwind CSS for styling
- Vite as the build tool

Follow these best practices:
- Write clean, readable code with appropriate comments
- Follow the established project structure
- Test your changes before submitting a pull request

## Troubleshooting

If you encounter issues with the installation:

1. Try removing node_modules and package-lock.json:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Make sure you're using the correct Node.js version.

3. Check for any error messages in the console.

