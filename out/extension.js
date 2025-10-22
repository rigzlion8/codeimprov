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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const profileView_1 = require("./views/profileView");
const chatView_1 = require("./views/chatView");
const codeAnalysisProvider_1 = require("./providers/codeAnalysisProvider");
const chatProvider_1 = require("./providers/chatProvider");
const storageService_1 = require("./services/storageService");
const aiService_1 = require("./services/aiService");
async function activate(context) {
    console.log('Code Analyzer AI extension is now active!');
    // Initialize services
    const storageService = new storageService_1.StorageService(context);
    const aiService = new aiService_1.AIService(storageService);
    // Initialize providers
    const chatProvider = new chatProvider_1.ChatProvider(aiService, storageService);
    const analysisProvider = new codeAnalysisProvider_1.CodeAnalysisProvider(aiService, storageService);
    // Register views
    const profileView = new profileView_1.ProfileView(storageService, aiService);
    const chatView = new chatView_1.ChatView(chatProvider);
    // Register commands
    const commands = [
        vscode.commands.registerCommand('codeAnalyzer.openProfile', () => {
            profileView.show();
        }),
        vscode.commands.registerCommand('codeAnalyzer.openChat', () => {
            chatView.show();
        }),
        vscode.commands.registerCommand('codeAnalyzer.analyzeCode', async () => {
            await analysisProvider.analyzeCurrentFile();
        }),
        vscode.commands.registerCommand('codeAnalyzer.suggestImprovements', async () => {
            await analysisProvider.suggestImprovements();
        })
    ];
    // Register tree data provider for chat view
    const treeDataProvider = chatProvider.getTreeDataProvider();
    const treeView = vscode.window.createTreeView('codeAnalyzerChat', {
        treeDataProvider
    });
    // Register text document change handler for auto-analysis
    if (vscode.workspace.getConfiguration('codeAnalyzer').get('autoAnalyze')) {
        const disposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                await analysisProvider.autoAnalyze(event.document);
            }
        });
        context.subscriptions.push(disposable);
    }
    // Add all disposables to context
    commands.forEach(command => context.subscriptions.push(command));
    context.subscriptions.push(treeView);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map