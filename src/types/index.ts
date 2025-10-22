import * as vscode from 'vscode';

export interface AIModel {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'deepseek' | 'custom';
    maxTokens: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    context?: CodeContext;
}

export interface CodeContext {
    filePath?: string;
    language?: string;
    selection?: any; // vscode.Selection type
    codeSnippet?: string;
}

export interface AnalysisResult {
    suggestions: Suggestion[];
    metrics: CodeMetrics;
    summary: string;
}

export interface Suggestion {
    type: 'improvement' | 'bug' | 'optimization' | 'security';
    title: string;
    description: string;
    lineNumber?: number;
    severity: 'low' | 'medium' | 'high';
    codeExample?: string;
}

export interface CodeMetrics {
    complexity: number;
    maintainability: number;
    securityScore: number;
    performanceScore: number;
}

export interface UserSettings {
    apiKey: string;
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    autoAnalyze: boolean;
}

export interface DiffChange {
    original: string;
    modified: string;
    range: any; // vscode.Range type
    description: string;
}