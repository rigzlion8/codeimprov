"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatView = void 0;
const vscode = __importStar(require("vscode"));
class ChatView {
    constructor(chatProvider) {
        this.chatProvider = chatProvider;
    }
    async show() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('codeAnalyzerChat', 'AI Code Assistant', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = await this.getWebviewContent();
        this.panel.webview.onDidReceiveMessage(async (message) => {
            await this.handleWebviewMessage(message);
        }, undefined);
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }
    async getWebviewContent() {
        const chatHistory = this.chatProvider.getChatHistory();
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 0;
                    margin: 0;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    color: var(--vscode-foreground);
                }
                .chat-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }
                .message {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 8px;
                    max-width: 80%;
                    word-wrap: break-word;
                }
                .user-message {
                    align-self: flex-end;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .assistant-message {
                    align-self: flex-start;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                }
                .input-container {
                    padding: 20px;
                    border-top: 1px solid var(--vscode-input-border);
                    display: flex;
                    gap: 10px;
                }
                #messageInput {
                    flex: 1;
                    padding: 10px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                }
                button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .code-block {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 10px;
                    border-radius: 4px;
                    margin: 5px 0;
                    font-family: var(--vscode-editor-font-family);
                }
                .timestamp {
                    font-size: 0.8em;
                    opacity: 0.7;
                    margin-top: 5px;
                }
            </style>
        </head>
        <body>
            <div class="chat-container" id="chatContainer">
                ${chatHistory.map(msg => `
                    <div class="message ${msg.role}-message">
                        <div>${this.formatMessageContent(msg.content)}</div>
                        <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Type your message..." />
                <button id="sendButton">Send</button>
                <button id="clearButton">Clear</button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const chatContainer = document.getElementById('chatContainer');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const clearButton = document.getElementById('clearButton');
                
                function scrollToBottom() {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
                
                function addMessage(content, role, timestamp) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = \`message \${role}-message\`;
                    messageDiv.innerHTML = \`
                        <div>\${formatMessageContent(content)}</div>
                        <div class="timestamp">\${new Date(timestamp).toLocaleTimeString()}</div>
                    \`;
                    chatContainer.appendChild(messageDiv);
                    scrollToBottom();
                }
                
                function formatMessageContent(content) {
                    // Simple code block formatting
                    return content.replace(/\\\`\\\`\\\`([\\s\\S]*?)\\\`\\\`\\\`/g, '<div class="code-block">$1</div>')
                                 .replace(/\\\`([^\\\`]+)\\\`/g, '<code>$1</code>')
                                 .replace(/\\n/g, '<br>');
                }
                
                sendButton.addEventListener('click', async () => {
                    const message = messageInput.value.trim();
                    if (!message) return;
                    
                    // Add user message immediately
                    addMessage(message, 'user', new Date());
                    
                    // Clear input and disable button
                    messageInput.value = '';
                    sendButton.disabled = true;
                    
                    try {
                        const response = await vscode.postMessage({
                            command: 'sendMessage',
                            message: message
                        });
                    } catch (error) {
                        addMessage('Error: ' + error.message, 'assistant', new Date());
                    } finally {
                        sendButton.disabled = false;
                        messageInput.focus();
                    }
                });
                
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendButton.click();
                    }
                });
                
                clearButton.addEventListener('click', () => {
                    if (confirm('Clear all chat history?')) {
                        vscode.postMessage({
                            command: 'clearChat'
                        });
                    }
                });
                
                // Handle incoming messages from extension
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'newMessage':
                            addMessage(message.content, message.role, message.timestamp);
                            break;
                            
                        case 'clearChat':
                            chatContainer.innerHTML = '';
                            break;
                            
                        case 'error':
                            addMessage('Error: ' + message.content, 'assistant', new Date());
                            break;
                    }
                });
                
                // Initial scroll to bottom
                scrollToBottom();
                messageInput.focus();
            </script>
        </body>
        </html>`;
    }
    formatMessageContent(content) {
        // Format code blocks and other markdown-like syntax
        return content
            .replace(/```([\s\S]*?)```/g, '<div class="code-block">$1</div>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    async handleWebviewMessage(message) {
        switch (message.command) {
            case 'sendMessage':
                await this.sendMessage(message.message);
                break;
            case 'clearChat':
                await this.clearChat();
                break;
        }
    }
    async sendMessage(message) {
        try {
            const editor = vscode.window.activeTextEditor;
            let context;
            if (editor) {
                const document = editor.document;
                const selection = editor.selection;
                const selectedText = document.getText(selection);
                context = {
                    filePath: document.fileName,
                    language: document.languageId,
                    selection: selection,
                    codeSnippet: selectedText || document.getText()
                };
            }
            const response = await this.chatProvider.sendMessage(message, context);
            if (this.panel) {
                this.panel.webview.postMessage({
                    type: 'newMessage',
                    content: response,
                    role: 'assistant',
                    timestamp: new Date()
                });
            }
        }
        catch (error) {
            if (this.panel) {
                this.panel.webview.postMessage({
                    type: 'error',
                    content: error.message
                });
            }
        }
    }
    async clearChat() {
        await this.chatProvider.clearChat();
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'clearChat'
            });
        }
    }
}
exports.ChatView = ChatView;
//# sourceMappingURL=chatView.js.map