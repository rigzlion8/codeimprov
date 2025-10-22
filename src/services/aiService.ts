import * as vscode from 'vscode';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';
import { StorageService } from './storageService';
import { AIModel, AnalysisResult, Suggestion, ChatMessage } from '../types';
import { SecurityService } from './securityService';

export class AIService {
    private openai: OpenAIApi | null = null;
    private securityService: SecurityService;

    constructor(private storageService: StorageService) {
        this.securityService = new SecurityService();
        this.initializeOpenAI();
    }

    private initializeOpenAI() {
        const apiKey = this.storageService.getApiKey();
        if (apiKey && this.securityService.validateApiKey(apiKey)) {
            const configuration = new Configuration({
                apiKey: apiKey
            });
            this.openai = new OpenAIApi(configuration);
        }
    }

    async updateApiKey(apiKey: string): Promise<boolean> {
        if (!this.securityService.validateApiKey(apiKey)) {
            throw new Error('Invalid API key format');
        }

        try {
            const configuration = new Configuration({ apiKey });
            this.openai = new OpenAIApi(configuration);
            
            // Test the API key
            await this.testApiKey();
            
            await this.storageService.setApiKey(apiKey);
            return true;
        } catch (error) {
            throw new Error('Failed to validate API key');
        }
    }

    private async testApiKey(): Promise<boolean> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        try {
            await this.openai.listModels();
            return true;
        } catch (error) {
            throw new Error('API key validation failed');
        }
    }

    async analyzeCode(code: string, language: string): Promise<AnalysisResult> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized. Please check your API key.');
        }

        const prompt = this.buildAnalysisPrompt(code, language);
        
        try {
            const response = await this.openai.createChatCompletion({
                model: this.storageService.getModel(),
                messages: [{ role: 'system', content: prompt }],
                temperature: this.storageService.getTemperature(),
                max_tokens: this.storageService.getMaxTokens()
            });

            const result = response.data.choices[0]?.message?.content;
            if (!result) {
                throw new Error('No response from AI');
            }

            return this.parseAnalysisResult(result);
        } catch (error: any) {
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    async chat(messages: ChatMessage[], context?: any): Promise<string> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized. Please check your API key.');
        }

        const chatMessages: ChatCompletionRequestMessage[] = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: this.buildChatMessage(msg, context)
        }));

        try {
            const response = await this.openai.createChatCompletion({
                model: this.storageService.getModel(),
                messages: chatMessages,
                temperature: this.storageService.getTemperature(),
                max_tokens: this.storageService.getMaxTokens()
            });

            return response.data.choices[0]?.message?.content || 'No response received';
        } catch (error: any) {
            throw new Error(`Chat failed: ${error.message}`);
        }
    }

    async generateImprovements(code: string, language: string, issues: string[]): Promise<string> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        const prompt = this.buildImprovementPrompt(code, language, issues);
        
        const response = await this.openai.createChatCompletion({
            model: this.storageService.getModel(),
            messages: [{ role: 'system', content: prompt }],
            temperature: this.storageService.getTemperature(),
            max_tokens: this.storageService.getMaxTokens()
        });

        return response.data.choices[0]?.message?.content || 'No improvements suggested';
    }

    private buildAnalysisPrompt(code: string, language: string): string {
        return `
        Analyze the following ${language} code and provide a comprehensive analysis:

        Code:
        ${code}

        Please provide analysis in the following JSON format:
        {
            "suggestions": [
                {
                    "type": "improvement|bug|optimization|security",
                    "title": "Brief title",
                    "description": "Detailed description",
                    "lineNumber": number,
                    "severity": "low|medium|high",
                    "codeExample": "Improved code example if applicable"
                }
            ],
            "metrics": {
                "complexity": 0-100,
                "maintainability": 0-100,
                "securityScore": 0-100,
                "performanceScore": 0-100
            },
            "summary": "Overall code quality summary"
        }

        Focus on:
        - Code quality and best practices
        - Potential bugs and issues
        - Performance optimizations
        - Security vulnerabilities
        - Maintainability concerns
        `;
    }

    private buildChatMessage(message: ChatMessage, context?: any): string {
        let content = message.content;
        
        if (context?.codeSnippet) {
            content += `\n\nCurrent code context:\n${context.codeSnippet}`;
        }
        
        if (context?.filePath) {
            content += `\nFile: ${context.filePath}`;
        }

        return content;
    }

    private buildImprovementPrompt(code: string, language: string, issues: string[]): string {
        return `
        Based on the following ${language} code and identified issues, provide specific improvements:

        Code:
        ${code}

        Identified Issues:
        ${issues.join('\n')}

        Please provide:
        1. Refactored code with improvements
        2. Explanation of changes
        3. Before/after comparisons
        4. Best practices applied
        `;
    }

    private parseAnalysisResult(result: string): AnalysisResult {
        try {
            // Try to parse JSON from the response
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback to basic structure if JSON parsing fails
            return {
                suggestions: [{
                    type: 'improvement',
                    title: 'Analysis Complete',
                    description: result,
                    severity: 'medium'
                }],
                metrics: {
                    complexity: 50,
                    maintainability: 50,
                    securityScore: 50,
                    performanceScore: 50
                },
                summary: 'Analysis completed. See suggestions for details.'
            };
        } catch (error) {
            throw new Error('Failed to parse AI analysis result');
        }
    }

    isConfigured(): boolean {
        return this.openai !== null;
    }
}