import * as vscode from 'vscode';
import { AIService } from '../services/aiService';
import { StorageService } from '../services/storageService';
import { ChatMessage, CodeContext } from '../types/index';

export class ChatProvider implements vscode.TreeDataProvider<ChatItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ChatItem | undefined | null | void> = new vscode.EventEmitter<ChatItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ChatItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private chatHistory: ChatMessage[] = [];

    constructor(
        private aiService: AIService,
        private storageService: StorageService
    ) {
        this.loadChatHistory();
    }

    private async loadChatHistory(): Promise<void> {
        this.chatHistory = await this.storageService.getChatHistory();
        this.refresh();
    }

    async sendMessage(message: string, context?: CodeContext): Promise<string> {
        if (!this.aiService.isConfigured()) {
            throw new Error('Please configure your AI settings first');
        }

        const userMessage: ChatMessage = {
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
            
            const assistantMessage: ChatMessage = {
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
        } catch (error: any) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    async clearChat(): Promise<void> {
        this.chatHistory = [];
        await this.storageService.clearChatHistory();
        this.refresh();
    }

    getTreeDataProvider(): vscode.TreeDataProvider<ChatItem> {
        return this;
    }

    getTreeItem(element: ChatItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ChatItem): Thenable<ChatItem[]> {
        if (element) {
            // Child items if needed
            return Promise.resolve([]);
        } else {
            // Root items - chat history
            const items = this.chatHistory.map(msg => 
                new ChatItem(
                    msg.content.substring(0, 50) + '...',
                    msg.role === 'user' ? 'user' : 'assistant',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeAnalyzer.openChatMessage',
                        title: 'Open Message',
                        arguments: [msg]
                    }
                )
            );
            return Promise.resolve(items);
        }
    }

    private async saveChatHistory(): Promise<void> {
        await this.storageService.saveChatHistory(this.chatHistory);
    }

    private refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getChatHistory(): ChatMessage[] {
        return [...this.chatHistory];
    }
}

class ChatItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly role: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        
        this.tooltip = this.label;
        this.description = this.role;
        this.iconPath = new vscode.ThemeIcon(role === 'user' ? 'person' : 'robot');
    }
}