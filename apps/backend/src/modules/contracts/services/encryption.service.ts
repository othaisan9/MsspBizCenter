import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly authTagLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const keyString = this.configService.get<string>('CONTRACT_ENCRYPTION_KEY');

    if (!keyString) {
      throw new Error('CONTRACT_ENCRYPTION_KEY environment variable is not set');
    }

    // 키는 64자 hex 문자열이어야 함 (32바이트)
    if (keyString.length !== 64) {
      throw new Error('CONTRACT_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    this.encryptionKey = Buffer.from(keyString, 'hex');
  }

  /**
   * 평문을 AES-256-GCM으로 암호화
   * @param plaintext 암호화할 평문
   * @returns iv:authTag:ciphertext 형식의 암호화된 문자열
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // iv, authTag, ciphertext를 :로 구분하여 반환
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * AES-256-GCM 암호문을 복호화
   * @param encrypted iv:authTag:ciphertext 형식의 암호화된 문자열
   * @returns 복호화된 평문
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected: iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 암호화 키 생성 헬퍼 (개발용)
   * @returns 32바이트 hex 문자열
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
