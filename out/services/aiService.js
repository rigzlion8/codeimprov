"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = require("openai");
const securityService_1 = require("./securityService");
class AIService {
    constructor(storageService) {
        this.storageService = storageService;
        this.openai = null;
        this.securityService = new securityService_1.SecurityService();
        this.initializeOpenAI();
    }
    initializeOpenAI() {
        const apiKey = this.storageService.getApiKey();
        if (apiKey && this.securityService.validateApiKey(apiKey)) {
            const configuration = new openai_1.Configuration({
                apiKey: apiKey
            });
            this.openai = new openai_1.OpenAIApi(configuration);
        }
    }
    async updateApiKey(apiKey) {
        if (!this.securityService.validateApiKey(apiKey)) {
            throw new Error('Invalid API key format');
        }
        try {
            const configuration = new openai_1.Configuration({ apiKey });
            this.openai = new openai_1.OpenAIApi(configuration);
            // Test the API key
            await this.testApiKey();
            await this.storageService.setApiKey(apiKey);
            return true;
        }
        catch (error) {
            throw new Error('Failed to validate API key');
        }
    }
    async testApiKey() {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }
        try {
            await this.openai.listModels();
            return true;
        }
        catch (error) {
            throw new Error('API key validation failed');
        }
    }
    async analyzeCode(code, language) {
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
        }
        catch (error) {
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }
    async chat(messages, context) {
        if (!this.openai) {
            throw new Error('OpenAI not initialized. Please check your API key.');
        }
        const chatMessages = messages.map(msg => ({
            role: msg.role,
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
        }
        catch (error) {
            throw new Error(`Chat failed: ${error.message}`);
        }
    }
    async generateImprovements(code, language, issues) {
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
    buildAnalysisPrompt(code, language) {
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
    buildChatMessage(message, context) {
        let content = message.content;
        if (context?.codeSnippet) {
            content += `\n\nCurrent code context:\n${context.codeSnippet}`;
        }
        if (context?.filePath) {
            content += `\nFile: ${context.filePath}`;
        }
        return content;
    }
    buildImprovementPrompt(code, language, issues) {
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
    parseAnalysisResult(result) {
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
        }
        catch (error) {
            throw new Error('Failed to parse AI analysis result');
        }
    }
    isConfigured() {
        return this.openai !== null;
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map