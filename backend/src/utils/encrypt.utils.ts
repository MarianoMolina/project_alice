import crypto from 'crypto';

export class EncryptionService {
    private static instance: EncryptionService;
    private algorithm = 'aes-256-gcm';
    private keyLength = 32;
    private ivLength = 12;
    private tagLength = 16;
    private encryptionKey: Buffer;

    private constructor(key: string) {
        if (!key) {
            throw new Error('Encryption key is required');
        }
        this.encryptionKey = crypto.scryptSync(key, 'salt', this.keyLength);
    }

    public static initialize(key: string): void {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService(key);
        }
    }

    public static getInstance(): EncryptionService {
        if (!EncryptionService.instance) {
            throw new Error('EncryptionService must be initialized with a key first');
        }
        return EncryptionService.instance;
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv) as crypto.CipherGCM;
        
        let encryptedContent = cipher.update(text, 'utf8', 'hex');
        encryptedContent += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedContent}`;
    }

    decrypt(encryptedData: string): string {
        const [ivHex, authTagHex, encryptedContent] = encryptedData.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv) as crypto.DecipherGCM;
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
}