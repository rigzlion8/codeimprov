"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
class SecurityService {
    validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }
        // Basic OpenAI API key validation (starts with sk- and has correct length)
        if (apiKey.startsWith('sk-')) {
            return apiKey.length >= 20;
        }
        // Add validation for other API providers as needed
        return true;
    }
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }
        // Remove potentially dangerous characters and scripts
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }
    validateCodeSnippet(code) {
        if (typeof code !== 'string') {
            return false;
        }
        // Check for extremely long inputs (DOS protection)
        if (code.length > 100000) { // 100KB limit
            return false;
        }
        // Check for potentially dangerous patterns
        const dangerousPatterns = [
            /process\.env/,
            /require\(['"]fs['"]\)/,
            /eval\(/,
            /Function\(/,
            /child_process/,
            /execSync|execFileSync/
        ];
        return !dangerousPatterns.some(pattern => pattern.test(code));
    }
    encryptSensitiveData(data) {
        // In a production environment, use proper encryption
        // This is a basic obfuscation for demonstration
        return Buffer.from(data).toString('base64');
    }
    decryptSensitiveData(encryptedData) {
        try {
            return Buffer.from(encryptedData, 'base64').toString();
        }
        catch {
            return '';
        }
    }
}
exports.SecurityService = SecurityService;
//# sourceMappingURL=securityService.js.map