"""AES-256-GCM Encryption Service for Contract Amounts"""
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class EncryptionService:
    """
    AES-256-GCM encryption service for sensitive data (e.g., contract amounts)

    Uses environment variable CONTRACT_ENCRYPTION_KEY (must be 32 bytes/characters)
    """

    def __init__(self):
        key_str = os.getenv('CONTRACT_ENCRYPTION_KEY', 'change-this-to-32-character-key!!')
        if len(key_str) < 32:
            raise ValueError(
                f"CONTRACT_ENCRYPTION_KEY must be at least 32 characters (got {len(key_str)})"
            )
        self.key = key_str[:32].encode('utf-8')  # Use first 32 bytes
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string

        Args:
            plaintext: String to encrypt (e.g., "1000000")

        Returns:
            Base64-encoded ciphertext (nonce + ciphertext)
        """
        nonce = os.urandom(12)  # 96-bit nonce for GCM
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)

        # Combine nonce + ciphertext and encode as base64
        combined = nonce + ciphertext
        return base64.b64encode(combined).decode('utf-8')

    def decrypt(self, ciphertext_b64: str) -> str:
        """
        Decrypt base64-encoded ciphertext

        Args:
            ciphertext_b64: Base64-encoded ciphertext (nonce + ciphertext)

        Returns:
            Decrypted plaintext string

        Raises:
            cryptography.exceptions.InvalidTag: If decryption fails (wrong key or tampered data)
        """
        combined = base64.b64decode(ciphertext_b64)
        nonce = combined[:12]
        ciphertext = combined[12:]

        plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode('utf-8')
