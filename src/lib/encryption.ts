import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'aura-research-assistant-secret-key-32'; // Must be 32 characters
const IV_LENGTH = 16;

export function encryptPassword(password: string): string {
    try {
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(password, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        return '';
    }
}

export function decryptPassword(encryptedPassword: string): string {
    try {
        if (!encryptedPassword || !encryptedPassword.includes(':')) {
            return '';
        }

        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
        const parts = encryptedPassword.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
}
