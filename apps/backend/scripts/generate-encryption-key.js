#!/usr/bin/env node

/**
 * 계약 금액 암호화 키 생성 스크립트
 *
 * 사용법:
 *   node scripts/generate-encryption-key.js
 *
 * AES-256-GCM에 필요한 32바이트(256비트) 키를 생성합니다.
 */

const crypto = require('crypto');

function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log('='.repeat(70));
  console.log('계약 금액 암호화 키 생성 완료');
  console.log('='.repeat(70));
  console.log('\n다음 키를 .env 파일의 CONTRACT_ENCRYPTION_KEY에 설정하세요:\n');
  console.log(key);
  console.log('\n⚠️  주의:');
  console.log('  - 이 키는 반드시 안전하게 보관하세요');
  console.log('  - 키를 분실하면 암호화된 금액을 복구할 수 없습니다');
  console.log('  - 프로덕션 환경에서는 환경변수 또는 비밀 관리 시스템 사용 권장');
  console.log('='.repeat(70));
}

generateEncryptionKey();
