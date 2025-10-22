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
exports.ChatProvider = void 0;
const vscode = __importStar(require("vscode"));
class ChatProvider {
    constructor(aiService, storageService) {
        this.aiService = aiService;
        this.storageService = storageService;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.chatHistory = [];
        this.loadChatHistory();
    }
    async loadChatHistory() {
        this.chatHistory = await this.storageService.getChatHistory();
        this.refresh();
    }
    async sendMessage(message, context) {
        if (!this.aiService.isConfigured()) {
            throw new Error('Please configure your AI settings first');
        }
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: new Date(),
            context
        };
        this.chatHistory.push(userMessage);
        await this.saveChatHistory();
        try {
            const response = await this.aiService.chat(this.chatHistory, context);
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                context
            };
            this.chatHistory.push(assistantMessage);
            await this.saveChatHistory();
            this.refresh();
            return response;
        }
        catch (error) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }
    async clearChat() {
        this.chatHistory = [];
        await this.storageService.clearChatHistory();
        this.refresh();
    }
    getTreeDataProvider() {
        return this;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            // Child items if needed
            return Promise.resolve([]);
        }
        else {
            // Root items - chat history
            const items = this.chatHistory.map(msg => new ChatItem(msg.content.substring(0, 50) + '...', msg.role === 'user' ? 'user' : 'assistant', vscode.TreeItemCollapsibleState.None, {
                command: 'codeAnalyzer.openChatMessage',
                title: 'Open Message',
                arguments: [msg]
            }));
            return Promise.resolve(items);
        }
    }
    async saveChatHistory() {
        await this.storageService.saveChatHistory(this.chatHistory);
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getChatHistory() {
        return [...this.chatHistory];
    }
}
exports.ChatProvider = ChatProvider;
class ChatItem extends vscode.TreeItem {
    constructor(label, role, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.role = role;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.tooltip = this.label;
        this.description = this.role;
        this.iconPath = new vscode.ThemeIcon(role === 'user' ? 'person' : 'robot');
    }
}
//# sourceMappingURL=chatProvider.js.map