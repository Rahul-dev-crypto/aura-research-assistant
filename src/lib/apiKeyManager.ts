// API Key Rotation Manager
// Automatically rotates through multiple Gemini API keys when rate limits are hit

class ApiKeyManager {
    private keys: string[] = [];
    private currentIndex: number = 0;
    private keyUsageCount: Map<string, number> = new Map();
    private keyLastUsed: Map<string, number> = new Map();
    private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
    private readonly MAX_REQUESTS_PER_MINUTE = 14; // Conservative limit (free tier is 15/min)

    constructor() {
        this.loadKeys();
    }

    private loadKeys() {
        // Load keys from environment variable
        const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
        
        if (!keysString) {
            console.error('No API keys found in environment variables');
            return;
        }

        // Split by comma and filter out empty strings
        this.keys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
        
        console.log(`Loaded ${this.keys.length} API key(s) for rotation`);
        
        // Initialize usage tracking
        this.keys.forEach(key => {
            this.keyUsageCount.set(key, 0);
            this.keyLastUsed.set(key, 0);
        });
    }

    private resetKeyUsageIfNeeded(key: string) {
        const lastUsed = this.keyLastUsed.get(key) || 0;
        const now = Date.now();
        
        // Reset counter if more than 1 minute has passed
        if (now - lastUsed > this.RATE_LIMIT_WINDOW) {
            this.keyUsageCount.set(key, 0);
        }
    }

    private isKeyAvailable(key: string): boolean {
        this.resetKeyUsageIfNeeded(key);
        const usage = this.keyUsageCount.get(key) || 0;
        return usage < this.MAX_REQUESTS_PER_MINUTE;
    }

    private findNextAvailableKey(): string | null {
        const startIndex = this.currentIndex;
        
        // Try to find an available key starting from current index
        for (let i = 0; i < this.keys.length; i++) {
            const index = (startIndex + i) % this.keys.length;
            const key = this.keys[index];
            
            if (this.isKeyAvailable(key)) {
                this.currentIndex = index;
                return key;
            }
        }
        
        // No keys available - return the next one anyway (will wait for rate limit to reset)
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        const key = this.keys[this.currentIndex];
        
        // Reset the counter for this key (assuming rate limit window has passed)
        this.keyUsageCount.set(key, 0);
        
        return key;
    }

    public getNextKey(): string {
        if (this.keys.length === 0) {
            throw new Error('No API keys available');
        }

        const key = this.findNextAvailableKey();
        
        if (!key) {
            // Fallback to first key if something goes wrong
            return this.keys[0];
        }

        // Update usage tracking
        const currentUsage = this.keyUsageCount.get(key) || 0;
        this.keyUsageCount.set(key, currentUsage + 1);
        this.keyLastUsed.set(key, Date.now());

        const maskedKey = key.substring(0, 10) + '...' + key.substring(key.length - 4);
        console.log(`Using API key: ${maskedKey} (Usage: ${currentUsage + 1}/${this.MAX_REQUESTS_PER_MINUTE})`);

        return key;
    }

    public markKeyAsExhausted(key: string) {
        // Mark this key as exhausted by setting usage to max
        this.keyUsageCount.set(key, this.MAX_REQUESTS_PER_MINUTE);
        console.log(`Key marked as exhausted, rotating to next key`);
        
        // Move to next key
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }

    public getKeyCount(): number {
        return this.keys.length;
    }

    public getCurrentKeyInfo(): { index: number; total: number; usage: number } {
        const key = this.keys[this.currentIndex];
        return {
            index: this.currentIndex + 1,
            total: this.keys.length,
            usage: this.keyUsageCount.get(key) || 0
        };
    }
}

// Singleton instance
const apiKeyManager = new ApiKeyManager();

export default apiKeyManager;
