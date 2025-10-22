import * as vscode from 'vscode';
import { UserSettings, AIModel } from '../types';

export class StorageService {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    getApiKey(): string {
        return this.context.globalState.get('codeAnalyzer.apiKey', '') || 
               vscode.workspace.getConfiguration('codeAnalyzer.ai').get('apiKey', '');
    }

    async setApiKey(apiKey: string): Promise<void> {
        await this.context.globalState.update('codeAnalyzer.apiKey', apiKey);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('apiKey', apiKey, true);
    }

    getModel(): string {
        return this.context.globalState.get('codeAnalyzer.model', 'gpt-4') || 
               vscode.workspace.getConfiguration('codeAnalyzer.ai').get('model', 'gpt-4');
    }

    async setModel(model: string): Promise<void> {
        await this.context.globalState.update('codeAnalyzer.model', model);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('model', model, true);
    }

    getTemperature(): number {
        return this.context.globalState.get('codeAnalyzer.temperature', 0.3) || 
               vscode.workspace.getConfiguration('codeAnalyzer.ai').get('temperature', 0.3);
    }

    async setTemperature(temperature: number): Promise<void> {
        await this.context.globalState.update('codeAnalyzer.temperature', temperature);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('temperature', temperature, true);
    }

    getMaxTokens(): number {
        return this.context.globalState.get('codeAnalyzer.maxTokens', 2000) || 
               vscode.workspace.getConfiguration('codeAnalyzer.ai').get('maxTokens', 2000);
    }

    async setMaxTokens(maxTokens: number): Promise<void> {
        await this.context.globalState.update('codeAnalyzer.maxTokens', maxTokens);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('maxTokens', maxTokens, true);
    }

    getAutoAnalyze(): boolean {
        return this.context.globalState.get('codeAnalyzer.autoAnalyze', false) || 
               vscode.workspace.getConfiguration('codeAnalyzer').get('autoAnalyze', false);
    }

    async setAutoAnalyze(autoAnalyze: boolean): Promise<void> {
        await this.context.globalState.update('codeAnalyzer.autoAnalyze', autoAnalyze);
        await vscode.workspace.getConfiguration('codeAnalyzer').update('autoAnalyze', autoAnalyze, true);
    }

    async getChatHistory(): Promise<any[]> {
        return this.context.globalState.get('codeAnalyzer.chatHistory', []);
    }

    async saveChatHistory(history: any[]): Promise<void> {
        await this.context.globalState.update('codeAnalyzer.chatHistory', history);
    }

    async clearChatHistory(): Promise<void> {
        await this.context.globalState.update('codeAnalyzer.chatHistory', []);
    }

    async getAnalysisHistory(): Promise<any[]> {
        return this.context.globalState.get('codeAnalyzer.analysisHistory', []);
    }

    async saveAnalysis(analysis: any): Promise<void> {
        const history = await this.getAnalysisHistory();
        history.unshift({
            ...analysis,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        });
        
        // Keep only last 50 analyses
        if (history.length > 50) {
            history.pop();
        }
        
        await this.context.globalState.update('codeAnalyzer.analysisHistory', history);
    }

    async getUserSettings(): Promise<UserSettings> {
        return {
            apiKey: this.getApiKey(),
            model: this.getModel(),
            temperature: this.getTemperature(),
            maxTokens: this.getMaxTokens(),
            autoAnalyze: this.getAutoAnalyze()
        };
    }

    async updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
        if (settings.apiKey !== undefined) {
            await this.setApiKey(settings.apiKey);
        }
        if (settings.model !== undefined) {
            await this.setModel(settings.model);
        }
        if (settings.temperature !== undefined) {
            await this.setTemperature(settings.temperature);
        }
        if (settings.maxTokens !== undefined) {
            await this.setMaxTokens(settings.maxTokens);
        }
        if (settings.autoAnalyze !== undefined) {
            await this.setAutoAnalyze(settings.autoAnalyze);
        }
    }
}