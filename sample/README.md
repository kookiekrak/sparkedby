# SparkedBy Landing Page Template

## Overview

This is a template for quickly generating branded business landing pages using SparkedBy. The template includes a modern, responsive design with a waitlist signup form that connects to a backend API for collecting early user interest.

## Features

- 🎨 Modern, responsive UI built with React and Tailwind CSS
- 📝 Waitlist signup form with validation
- 🔄 API integration for storing signup information
- 🎯 Easily configurable branding and messaging
- 📱 Mobile-friendly design
- 🚀 Fast development using Vite

## Getting Started

### Prerequisites
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
