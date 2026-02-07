import type { NextConfig } from 'next';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// VERSION 파일에서 버전 읽기
const getVersion = (): string => {
  try {
    // 1. Docker 컨테이너 환경
    const dockerPath = resolve(process.cwd(), 'VERSION');
    if (existsSync(dockerPath)) {
      return readFileSync(dockerPath, 'utf-8').trim();
    }
    // 2. 로컬 개발 환경
    const versionPath = resolve(__dirname, '../../VERSION');
    if (existsSync(versionPath)) {
      return readFileSync(versionPath, 'utf-8').trim();
    }
  } catch {
    console.warn('Failed to read VERSION file, using default');
  }
  return '0.0.0';
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Docker 최적화
  output: 'standalone',

  // 환경변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || getVersion(),
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // 개발 환경 API 프록시
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
