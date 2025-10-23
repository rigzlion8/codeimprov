# AI Code Analyzer - Technical Guidelines

## Tech Stack

• **Runtime Environment**: Node.js 16.x (VS Code extension runtime)
• **Language**: TypeScript (strictly typed)
• **Framework**: VS Code Extension API
• **AI Providers**: OpenAI API and DeepSeek API
• **HTTP Client**: Axios for API requests
• **UI Framework**: VS Code Webview API (HTML/CSS/JavaScript)
• **Storage**: VS Code Global State API
• **Build Tool**: Webpack with ts-loader
• **Linting**: ESLint with TypeScript plugin
• **Package Management**: npm

## Library Usage Rules

### AI & HTTP
• **OpenAI Integration**: Use the official `openai` package only for OpenAI API interactions
• **HTTP Requests**: Use `axios` for all HTTP requests to AI providers
• **API Abstraction**: All AI provider logic must go through `AIService` - no direct API calls in other files

### UI & Views
• **Webviews**: Use VS Code's built-in webview API for all UI components
• **DOM Manipulation**: Vanilla JavaScript only in webviews - no external UI frameworks
• **Styling**: Use VS Code's CSS variables for consistent theming (`var(--vscode-*)`)

### Data Management
• **Storage**: Use `StorageService` for all data persistence - never access `context.globalState` directly
• **Configuration**: Use VS Code's configuration API through `vscode.workspace.getConfiguration()`

### Extension Structure
• **Commands**: Register all commands in `extension.ts` only
• **Providers**: Implement VS Code providers (TreeDataProvider, etc.) in dedicated provider files
• **Services**: Business logic goes in service files (`AIService`, `StorageService`, etc.)
• **Views**: Separate UI logic into view files (`ProfileView`, `ChatView`, etc.)

### Security
• **API Keys**: Always use `SecurityService` for validation and never log API keys
• **User Input**: Sanitize all user input through security service before processing
• **Code Snippets**: Validate code snippets with length and pattern checks before sending to AI

### Error Handling
• **Error Types**: Use `AxiosError` for HTTP errors and `AxiosError` for AI-specific errors
• **User Messages**: Show VS Code notifications (`vscode.window.showErrorMessage`) for user-facing errors
• **Error Boundaries**: Handle errors at the service level and propagate meaningful messages

### Async Operations
• **Progress Indicators**: Use `vscode.window.withProgress` for long-running operations
• **Cancellation**: Implement proper cancellation tokens for interruptible operations
• **Threading**: Use VS Code's async patterns - avoid manual thread management