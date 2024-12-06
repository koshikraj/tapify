import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;


// Interfaces for type safety
export interface VoucherMetadata {
    creatorAddress: string;
    voucherDetails: {
      type: 'basename' | 'token' | 'subscription'
      spendLimit?: number;
    };
    sessionSecretKey: string;
    chainId: number;
  }
  
 export  interface StoredVoucher {
    voucherId: string;
    encryptedMetadata: string;
    status: 'active' | 'redeemed';
  }

  
  // Derive encryption key from NFC secret
const deriveKey = (nfcSecret: string): Buffer => {
    return crypto.createHash('sha256').update(nfcSecret).digest();
  };


 export const deriveId = (nfcSecret: string): string => {

  return crypto.createHash('sha256')
      .update(nfcSecret)
      .digest('hex')
      .slice(0, 16);
 }
  
 // Encrypt voucher metadata
export const encryptMetadata = (metadata: VoucherMetadata, nfcSecret: string): StoredVoucher => {
    // Derive encryption key from NFC secret
    const key = deriveKey(nfcSecret);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Convert metadata to JSON string
    const metadataJson = JSON.stringify(metadata);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Encrypt metadata
    const encrypted = Buffer.concat([
      cipher.update(metadataJson, 'utf8'),
      cipher.final()
    ]);
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Generate voucher ID (derived from NFC secret)
    const voucherId = deriveId(nfcSecret);
    
    // Combine IV, encrypted data, and tag
    const encryptedMetadata = Buffer.concat([iv, encrypted, tag]).toString('base64');
    
    return {
      voucherId,
      encryptedMetadata,
      status: 'active'
    };
  };

  // Decrypt voucher metadata
export const decryptMetadata = (encryptedMetadata: string, nfcSecret: string): VoucherMetadata => {

    // Derive encryption key from NFC secret
    const key = deriveKey(nfcSecret);
    
    // Decode the stored encrypted metadata
    const encryptedBuffer = Buffer.from(encryptedMetadata, 'base64');
    
    // Extract IV, encrypted data, and tag
    const iv = encryptedBuffer.slice(0, IV_LENGTH);
    const encrypted = encryptedBuffer.slice(IV_LENGTH, -TAG_LENGTH);
    const tag = encryptedBuffer.slice(-TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt metadata
    const decryptedJson = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
    
    // Parse and return decrypted metadata
    return JSON.parse(decryptedJson);
  };
   