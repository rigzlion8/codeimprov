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
exports.StorageService = void 0;
const vscode = __importStar(require("vscode"));
class StorageService {
    constructor(context) {
        this.context = context;
    }
    getApiKey() {
        return this.context.globalState.get('codeAnalyzer.apiKey', '') ||
            vscode.workspace.getConfiguration('codeAnalyzer.ai').get('apiKey', '');
    }
    async setApiKey(apiKey) {
        await this.context.globalState.update('codeAnalyzer.apiKey', apiKey);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('apiKey', apiKey, true);
    }
    getModel() {
        return this.context.globalState.get('codeAnalyzer.model', 'gpt-4') ||
            vscode.workspace.getConfiguration('codeAnalyzer.ai').get('model', 'gpt-4');
    }
    async setModel(model) {
        await this.context.globalState.update('codeAnalyzer.model', model);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('model', model, true);
    }
    getTemperature() {
        return this.context.globalState.get('codeAnalyzer.temperature', 0.3) ||
            vscode.workspace.getConfiguration('codeAnalyzer.ai').get('temperature', 0.3);
    }
    async setTemperature(temperature) {
        await this.context.globalState.update('codeAnalyzer.temperature', temperature);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('temperature', temperature, true);
    }
    getMaxTokens() {
        return this.context.globalState.get('codeAnalyzer.maxTokens', 2000) ||
            vscode.workspace.getConfiguration('codeAnalyzer.ai').get('maxTokens', 2000);
    }
    async setMaxTokens(maxTokens) {
        await this.context.globalState.update('codeAnalyzer.maxTokens', maxTokens);
        await vscode.workspace.getConfiguration('codeAnalyzer.ai').update('maxTokens', maxTokens, true);
    }
    getAutoAnalyze() {
        return this.context.globalState.get('codeAnalyzer.autoAnalyze', false) ||
            vscode.workspace.getConfiguration('codeAnalyzer').get('autoAnalyze', false);
    }
    async setAutoAnalyze(autoAnalyze) {
        await this.context.globalState.update('codeAnalyzer.autoAnalyze', autoAnalyze);
        await vscode.workspace.getConfiguration('codeAnalyzer').update('autoAnalyze', autoAnalyze, true);
    }
    async getChatHistory() {
        return this.context.globalState.get('codeAnalyzer.chatHistory', []);
    }
    async saveChatHistory(history) {
        await this.context.globalState.update('codeAnalyzer.chatHistory', history);
    }
    async clearChatHistory() {
        await this.context.globalState.update('codeAnalyzer.chatHistory', []);
    }
    async getAnalysisHistory() {
        return this.context.globalState.get('codeAnalyzer.analysisHistory', []);
    }
    async saveAnalysis(analysis) {
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
    async getUserSettings() {
        return {
            apiKey: this.getApiKey(),
            model: this.getModel(),
            temperature: this.getTemperature(),
            maxTokens: this.getMaxTokens(),
            autoAnalyze: this.getAutoAnalyze()
        };
    }
    async updateUserSettings(settings) {
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
exports.StorageService = StorageService;
//# sourceMappingURL=storageService.js.map