# Code Analyzer AI - VS Code Extension

An intelligent VS Code extension that provides AI-powered code analysis, editing suggestions, and chat functionality.

## Features

- 🤖 **AI-Powered Code Analysis**: Get detailed analysis of your code quality, bugs, and improvements
- 💬 **Interactive Chat**: Chat with AI about your code in real-time
- 🔧 **Smart Suggestions**: Receive context-aware code improvement suggestions
- 📊 **Code Metrics**: Understand code complexity, maintainability, security, and performance scores
- 🔒 **Secure**: Your API keys and data are stored securely
- ⚡ **Fast & Efficient**: Optimized for performance with minimal impact on your workflow

## Setup

1. Install the extension from VS Code Marketplace
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run "Open AI Profile Settings"
4. Enter your OpenAI API key
5. Configure your preferred model and settings
6. Start analyzing code and chatting with the AI assistant!

## Commands

- `Code Analyzer AI: Open AI Profile Settings` - Configure API settings
- `Code Analyzer AI: Open AI Chat` - Open chat panel
- `Code Analyzer AI: Analyze Current Code` - Analyze current file
- `Code Analyzer AI: Suggest Improvements` - Get improvement suggestions

## Configuration

The extension supports the following settings:

- `codeAnalyzer.ai.apiKey`: Your OpenAI API key
- `codeAnalyzer.ai.model`: AI model to use (gpt-4, gpt-4-turbo, gpt-3.5-turbo)
- `codeAnalyzer.ai.temperature`: AI creativity level (0-1)
- `codeAnalyzer.ai.maxTokens`: Maximum response length
- `codeAnalyzer.autoAnalyze`: Auto-analyze code on changes

## Privacy & Security

- Your API key is stored securely in VS Code's global state
- Code snippets sent for analysis are processed by OpenAI's API
- No personal data is stored or shared with third parties
- All communications are encrypted

## Support

For issues and feature requests, please visit our GitHub repository.

## License

MIT License