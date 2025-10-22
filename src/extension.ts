import * as vscode from 'vscode';
import { ProfileView } from './views/profileView';
import { ChatView } from './views/chatView';
import { CodeAnalysisProvider } from './providers/codeAnalysisProvider';
import { ChatProvider } from './providers/chatProvider';
import { StorageService } from './services/storageService';
import { AIService } from './services/aiService';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Code Analyzer AI extension is now active!');

    // Initialize services
    const storageService = new StorageService(context);
    const aiService = new AIService(storageService);
    
    // Initialize providers
    const chatProvider = new ChatProvider(aiService, storageService);
    const analysisProvider = new CodeAnalysisProvider(aiService, storageService);

    // Register views
    const profileView = new ProfileView(storageService, aiService);
    const chatView = new ChatView(chatProvider);

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

export function deactivate() {}