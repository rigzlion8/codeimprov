import * as vscode from 'vscode';
import { AIService } from '../services/aiService';
import { StorageService } from '../services/storageService';
import { AnalysisResult, Suggestion, DiffChange } from '../types';

export class CodeAnalysisProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(
        private aiService: AIService,
        private storageService: StorageService
    ) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('codeAnalyzer');
    }

    async analyzeCurrentFile(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const code = document.getText();
        const language = document.languageId;

        if (!this.aiService.isConfigured()) {
            vscode.window.showErrorMessage('Please configure your AI settings first');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Analyzing code...',
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0 });
                
                const result = await this.aiService.analyzeCode(code, language);
                
                progress.report({ increment: 100 });
                
                await this.storageService.saveAnalysis({
                    filePath: document.fileName,
                    result: result,
                    timestamp: new Date()
                });

                await this.displayAnalysisResults(result, document);
                vscode.window.showInformationMessage('Code analysis completed!');

            } catch (error: any) {
                vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
            }
        });
    }

    async suggestImprovements(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const code = document.getText();
        const language = document.languageId;

        // First analyze to get issues
        const analysis = await this.aiService.analyzeCode(code, language);
        const issues = analysis.suggestions.map(s => s.description);

        const improvements = await this.aiService.generateImprovements(code, language, issues);
        
        // Show improvements in a diff editor
        await this.showImprovementsDiff(code, improvements, document);
    }

    async autoAnalyze(document: vscode.TextDocument): Promise<void> {
        if (!this.storageService.getAutoAnalyze()) {
            return;
        }

        try {
            const code = document.getText();
            const language = document.languageId;
            
            const result = await this.aiService.analyzeCode(code, language);
            await this.updateDiagnostics(result, document);
        } catch (error) {
            // Silent fail for auto-analysis
            console.error('Auto-analysis failed:', error);
        }
    }

    private async displayAnalysisResults(result: AnalysisResult, document: vscode.TextDocument): Promise<void> {
        // Create a webview panel to show detailed analysis
        const panel = vscode.window.createWebviewPanel(
            'codeAnalysis',
            'Code Analysis Results',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = this.getAnalysisWebviewContent(result, document.fileName);

        // Update diagnostics
        await this.updateDiagnostics(result, document);
    }

    private async updateDiagnostics(result: AnalysisResult, document: vscode.TextDocument): Promise<void> {
        const diagnostics: vscode.Diagnostic[] = [];

        result.suggestions.forEach(suggestion => {
            if (suggestion.lineNumber) {
                const line = document.lineAt(suggestion.lineNumber - 1);
                const range = line.range;
                
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `${suggestion.title}: ${suggestion.description}`,
                    this.getDiagnosticSeverity(suggestion.severity)
                );
                
                diagnostic.source = 'CodeAnalyzerAI';
                diagnostics.push(diagnostic);
            }
        });

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private getDiagnosticSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'high':
                return vscode.DiagnosticSeverity.Error;
            case 'medium':
                return vscode.DiagnosticSeverity.Warning;
            case 'low':
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }

    private async showImprovementsDiff(originalCode: string, improvements: string, document: vscode.TextDocument): Promise<void> {
        // Create a temporary file with improvements
        const tempDocument = await vscode.workspace.openTextDocument({
            content: improvements,
            language: document.languageId
        });

        await vscode.commands.executeCommand('vscode.diff', 
            document.uri, 
            tempDocument.uri, 
            'Original vs Improved Code'
        );
    }

    private getAnalysisWebviewContent(result: AnalysisResult, fileName: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px;
                    color: var(--vscode-foreground);
                }
                .metric { 
                    background: var(--vscode-editor-background); 
                    padding: 10px; 
                    margin: 10px 0; 
                    border-radius: 4px;
                }
                .suggestion { 
                    border-left: 3px solid; 
                    padding: 10px; 
                    margin: 10px 0;
                }
                .high { border-color: #f85149; }
                .medium { border-color: #ffa657; }
                .low { border-color: #3fb950; }
                .severity { font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Code Analysis: ${fileName.split('/').pop()}</h1>
            
            <div class="metrics">
                <h2>Metrics</h2>
                <div class="metric">Complexity: ${result.metrics.complexity}/100</div>
                <div class="metric">Maintainability: ${result.metrics.maintainability}/100</div>
                <div class="metric">Security: ${result.metrics.securityScore}/100</div>
                <div class="metric">Performance: ${result.metrics.performanceScore}/100</div>
            </div>

            <h2>Summary</h2>
            <p>${result.summary}</p>

            <h2>Suggestions</h2>
            ${result.suggestions.map(s => `
                <div class="suggestion ${s.severity}">
                    <div class="severity">${s.severity.toUpperCase()} - ${s.type}</div>
                    <h3>${s.title}</h3>
                    <p>${s.description}</p>
                    ${s.lineNumber ? `<div>Line: ${s.lineNumber}</div>` : ''}
                    ${s.codeExample ? `<pre><code>${s.codeExample}</code></pre>` : ''}
                </div>
            `).join('')}
        </body>
        </html>`;
    }
}