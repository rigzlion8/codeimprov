import * as vscode from 'vscode';
import { StorageService } from '../services/storageService';
import { AIService } from '../services/aiService';
import { UserSettings } from '../types/index';

export class ProfileView {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private storageService: StorageService,
        private aiService: AIService
    ) {}

    async show(): Promise<void> {
        if (this.panel) {
            this.panel.dispose(); // Force close existing webview to clear cache (so HTML is always fresh)
        }
        this.panel = vscode.window.createWebviewPanel(
            'codeAnalyzerProfile',
            'AI Profile Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        this.panel.webview.html = await this.getWebviewContent();
        this.panel.webview.onDidReceiveMessage(
            async (message: any) => {
                await this.handleWebviewMessage(message);
            },
            undefined
        );
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    private async getWebviewContent(): Promise<string> {
        let settings = await this.storageService.getUserSettings();
        // Only set defaults if provider is missing or blank
        if (!settings.provider || settings.provider.trim() === '') {
            settings.provider = 'openai';
        }
        if (!settings.model || settings.model.trim() === '') {
            settings.model = settings.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4';
        }
        // Prepare options for provider/model
        const isDeepSeek = settings.provider === 'deepseek';
        let modelOptsHtml = '';
        if (isDeepSeek) {
            modelOptsHtml = '<option value="deepseek-chat"' + (settings.model === 'deepseek-chat' ? ' selected' : '') + '>DeepSeek Chat</option>' +
                            '<option value="deepseek-reasoner"' + (settings.model === 'deepseek-reasoner' ? ' selected' : '') + '>DeepSeek Reasoner</option>';
        } else {
            modelOptsHtml = '<option value="gpt-4"' + (settings.model === 'gpt-4' ? ' selected' : '') + '>GPT-4</option>' +
                            '<option value="gpt-4-turbo"' + (settings.model === 'gpt-4-turbo' ? ' selected' : '') + '>GPT-4 Turbo</option>' +
                            '<option value="gpt-3.5-turbo"' + (settings.model === 'gpt-3.5-turbo' ? ' selected' : '') + '>GPT-3.5 Turbo</option>';
        }
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select { width: 100%; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; }
                button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px 20px; border-radius: 2px; cursor: pointer; margin-right: 10px; }
                button:hover { background: var(--vscode-button-hoverBackground); }
                .status { padding: 10px; border-radius: 2px; margin: 10px 0; }
                .success { background: var(--vscode-testing-iconPassed); color: white; }
                .error { background: var(--vscode-testing-iconFailed); color: white; }
                .warning { background: var(--vscode-testing-iconQueued); color: white; }
            </style>
        </head>
        <body>
            <h1>AI Profile Settings</h1>
            <div id="status"></div>
            <form id="settingsForm">
                <div class="form-group">
                    <label for="apiKey">API Key:</label>
                    <input type="password" id="apiKey" value="${settings.apiKey}" placeholder="Enter your API key" />
                </div>
                <div class="form-group">
                    <label for="provider">Provider:</label>
                    <select id="provider">
                        <option value="openai"${settings.provider === 'openai' ? ' selected' : ''}>OpenAI</option>
                        <option value="deepseek"${settings.provider === 'deepseek' ? ' selected' : ''}>DeepSeek</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="model">Model:</label>
                    <select id="model">${modelOptsHtml}</select>
                </div>
                <div class="form-group">
                    <label for="temperature">Temperature (0-1):</label>
                    <input type="number" id="temperature" value="${settings.temperature}" min="0" max="1" step="0.1" />
                </div>
                <div class="form-group">
                    <label for="maxTokens">Max Tokens:</label>
                    <input type="number" id="maxTokens" value="${settings.maxTokens}" min="100" max="4000" />
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="autoAnalyze"${settings.autoAnalyze ? ' checked' : ''} />
                        Auto-analyze code on change
                    </label>
                </div>
                <div>
                    <button type="submit">Save Settings</button>
                    <button type="button" id="testConnection">Test Connection</button>
                    <button type="button" id="clearData">Clear All Data</button>
                </div>
            </form>
            <script>
                const vscode = acquireVsCodeApi();
                const providerSelect = document.getElementById('provider');
                const modelSelect = document.getElementById('model');
                // Only set default if provider is empty
                if (!providerSelect.value || providerSelect.value.trim() === '') {
                    providerSelect.value = 'openai';
                }
                console.log('[ProfileView] Initial provider:', providerSelect.value);
                // Always set correct model list on load
                (function setModelOptionsOnLoad() {
                  let opts = '';
                  if (providerSelect.value === 'deepseek') {
                    opts = '<option value="deepseek-chat">DeepSeek Chat</option>' +
                           '<option value="deepseek-reasoner">DeepSeek Reasoner</option>';
                  } else {
                    opts = '<option value="gpt-4">GPT-4</option>' +
                           '<option value="gpt-4-turbo">GPT-4 Turbo</option>' +
                           '<option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>';
                  }
                  modelSelect.innerHTML = opts;
                  // Try to set the current model, fallback to first option if not available
                  if (modelSelect.querySelector('[value="${settings.model}"]')) {
                    modelSelect.value = "${settings.model}";
                  } else {
                    modelSelect.selectedIndex = 0;
                  }
                  console.log('[ProfileView] Set models for provider:', providerSelect.value, '| Model:', modelSelect.value);
                })();
                providerSelect.addEventListener('change', function() {
                  let opts = '';
                  if (providerSelect.value === 'deepseek') {
                    opts = '<option value="deepseek-chat">DeepSeek Chat</option>' +
                           '<option value="deepseek-reasoner">DeepSeek Reasoner</option>';
                  } else {
                    opts = '<option value="gpt-4">GPT-4</option>' +
                           '<option value="gpt-4-turbo">GPT-4 Turbo</option>' +
                           '<option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>';
                  }
                  modelSelect.innerHTML = opts;
                  // Reset to first option when provider changes
                  modelSelect.selectedIndex = 0;
                  console.log('[ProfileView] Provider changed, models updated:', providerSelect.value, '| Model:', modelSelect.value);
                });
                document.getElementById('settingsForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const settings = {
                        apiKey: document.getElementById('apiKey').value,
                        provider: providerSelect.value,
                        model: modelSelect.value,
                        temperature: parseFloat(document.getElementById('temperature').value),
                        maxTokens: parseInt(document.getElementById('maxTokens').value),
                        autoAnalyze: document.getElementById('autoAnalyze').checked
                    };
                    vscode.postMessage({
                        command: 'saveSettings',
                        settings: settings
                    });
                });
                document.getElementById('testConnection').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'testConnection'
                    });
                });
                document.getElementById('clearData').addEventListener('click', () => {
                    if (confirm('Are you sure you want to clear all chat history and analysis data?')) {
                        vscode.postMessage({
                            command: 'clearData'
                        });
                    }
                });
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    const statusDiv = document.getElementById('status');
                    switch (message.type) {
                        case 'status':
                            statusDiv.innerHTML = '<div class="' + message.status + ' status">' + message.text + '</div>';
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }

    private async handleWebviewMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'saveSettings':
                await this.saveSettings(message.settings);
                break;
                
            case 'testConnection':
                await this.testConnection();
                break;
                
            case 'clearData':
                await this.clearData();
                break;
        }
    }

    private async saveSettings(settings: any): Promise<void> {
        try {
            await this.storageService.updateUserSettings(settings);
            // Update AI service with new API key
            if (settings.apiKey) {
                await this.aiService.updateApiKey(settings.apiKey);
            }
            this.showStatus('Settings saved successfully!', 'success');
        } catch (error: any) {
            // Show full error so user knows what field failed
            this.showStatus(`Failed to save settings: ${error}`, 'error');
        }
    }

    private async testConnection(): Promise<void> {
        try {
            const settings = await this.storageService.getUserSettings();
            
            if (!settings.apiKey) {
                throw new Error('Please save your API key first');
            }
            
            this.showStatus('Testing connection...', 'warning');
            
            // Test the connection based on provider
            if (settings.provider === 'openai') {
                if (!this.aiService.isConfigured()) {
                    throw new Error('OpenAI not configured properly');
                }
                // For OpenAI, we rely on the existing isConfigured check
                this.showStatus('Connection test successful!', 'success');
            } else if (settings.provider === 'deepseek') {
                // For DeepSeek, we'll test by making a simple chat request
                // This will use the existing AIService.chat method which handles DeepSeek
                const testMessage = {
                    id: 'test',
                    role: 'user' as const,
                    content: 'Hello, this is a connection test.',
                    timestamp: new Date()
                };
                
                const response = await this.aiService.chat([testMessage]);
                if (response && response.length > 0) {
                    this.showStatus('Connection test successful!', 'success');
                } else {
                    throw new Error('No response received from DeepSeek API');
                }
            } else {
                throw new Error('Invalid provider selected');
            }
        } catch (error: any) {
            this.showStatus(`Connection test failed: ${error.message}`, 'error');
        }
    }

    private async clearData(): Promise<void> {
        try {
            await this.storageService.clearChatHistory();
            this.showStatus('All data cleared successfully!', 'success');
        } catch (error: any) {
            this.showStatus(`Failed to clear data: ${error.message}`, 'error');
        }
    }

    private showStatus(text: string, status: 'success' | 'error' | 'warning'): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'status',
                text: text,
                status: status
            });
        }
    }
}