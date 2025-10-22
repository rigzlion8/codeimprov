import * as vscode from 'vscode';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';
import { StorageService } from './storageService';
import { AIModel, AnalysisResult, Suggestion, ChatMessage } from '../types/index';
import { SecurityService } from './securityService';
import axios from 'axios';

export class AIService {
    private openai: OpenAIApi | null = null;
    private securityService: SecurityService;

    constructor(private storageService: StorageService) {
        this.securityService = new SecurityService();
        this.initializeOpenAI();
    }

    private initializeOpenAI() {
        const apiKey = this.storageService.getApiKey();
        const provider = this.storageService.getProvider();
        
        // Only initialize OpenAI if provider is 'openai' and we have a valid API key
        if (provider === 'openai' && apiKey && this.securityService.validateApiKey(apiKey)) {
            const configuration = new Configuration({
                apiKey: apiKey
            });
            this.openai = new OpenAIApi(configuration);
        } else if (provider === 'deepseek') {
            // For DeepSeek, we don't need to initialize OpenAI
            this.openai = null;
        }
    }

    async updateApiKey(apiKey: string): Promise<boolean> {
        if (!this.securityService.validateApiKey(apiKey)) {
            throw new Error('Invalid API key format');
        }

        try {
            const provider = this.storageService.getProvider();
            
            if (provider === 'openai') {
                const configuration = new Configuration({ apiKey });
                this.openai = new OpenAIApi(configuration);
                
                // Test the API key
                await this.testApiKey();
            } else if (provider === 'deepseek') {
                // For DeepSeek, we don't need to initialize OpenAI
                this.openai = null;
                // Test DeepSeek API key by making a simple request
                await this.testDeepSeekApiKey(apiKey);
            }
            
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

    private async testDeepSeekApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await axios.post(
                'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: 'Test connection' }],
                    max_tokens: 10
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.status === 200;
        } catch (error: any) {
            throw new Error(`DeepSeek API key validation failed: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async analyzeCode(code: string, language: string): Promise<AnalysisResult> {
        const provider = this.storageService.getProvider();
        const prompt = this.buildAnalysisPrompt(code, language);
        
        try {
            if (provider === 'openai') {
                if (!this.openai) {
                    throw new Error('OpenAI not initialized. Please check your API key.');
                }

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
            } else if (provider === 'deepseek') {
                const apiKey = this.storageService.getApiKey();
                const model = this.storageService.getModel();
                const temperature = this.storageService.getTemperature();
                const max_tokens = this.storageService.getMaxTokens();
                
                const response = await axios.post(
                    'https://api.deepseek.com/v1/chat/completions',
                    {
                        model,
                        messages: [{ role: 'system', content: prompt }],
                        temperature,
                        max_tokens
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const result = response.data.choices[0]?.message?.content;
                if (!result) {
                    throw new Error('No response from DeepSeek API');
                }

                return this.parseAnalysisResult(result);
            } else {
                throw new Error('Unsupported provider for code analysis');
            }
        } catch (error: any) {
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    async chat(messages: ChatMessage[], context?: any): Promise<string> {
        const provider = this.storageService.getProvider();
        if (provider === 'openai') {
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
        } else if (provider === 'deepseek') {
            // Use DeepSeek API
            const apiKey = this.storageService.getApiKey();
            const model = this.storageService.getModel();
            const temperature = this.storageService.getTemperature();
            const max_tokens = this.storageService.getMaxTokens();
            const deepseekMessages = messages.map(msg => ({
                role: msg.role,
                content: this.buildChatMessage(msg, context)
            }));
            try {
                const result = await axios.post(
                    'https://api.deepseek.com/v1/chat/completions',
                    {
                        model,
                        messages: deepseekMessages,
                        temperature,
                        max_tokens
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                return result.data.choices[0]?.message?.content || 'No response received';
            } catch (error: any) {
                throw new Error(`Chat failed: ${error.response?.data?.error?.message || error.message}`);
            }
        } else {
            throw new Error('Invalid AI provider');
        }
    }

    async generateImprovements(code: string, language: string, issues: string[]): Promise<string> {
        const provider = this.storageService.getProvider();
        const prompt = this.buildImprovementPrompt(code, language, issues);
        
        try {
            if (provider === 'openai') {
                if (!this.openai) {
                    throw new Error('OpenAI not initialized');
                }

                const response = await this.openai.createChatCompletion({
                    model: this.storageService.getModel(),
                    messages: [{ role: 'system', content: prompt }],
                    temperature: this.storageService.getTemperature(),
                    max_tokens: this.storageService.getMaxTokens()
                });

                return response.data.choices[0]?.message?.content || 'No improvements suggested';
            } else if (provider === 'deepseek') {
                const apiKey = this.storageService.getApiKey();
                const model = this.storageService.getModel();
                const temperature = this.storageService.getTemperature();
                const max_tokens = this.storageService.getMaxTokens();
                
                const response = await axios.post(
                    'https://api.deepseek.com/v1/chat/completions',
                    {
                        model,
                        messages: [{ role: 'system', content: prompt }],
                        temperature,
                        max_tokens
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                return response.data.choices[0]?.message?.content || 'No improvements suggested';
            } else {
                throw new Error('Unsupported provider for improvement generation');
            }
        } catch (error: any) {
            throw new Error(`Improvement generation failed: ${error.message}`);
        }
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
        // For DeepSeek, we need to check if API key is available
        // For OpenAI, check if openai instance is initialized
        const apiKey = this.storageService.getApiKey();
        const provider = this.storageService.getProvider();
        
        if (provider === 'deepseek') {
            return !!apiKey && this.securityService.validateApiKey(apiKey);
        } else {
            return this.openai !== null;
        }
    }
}