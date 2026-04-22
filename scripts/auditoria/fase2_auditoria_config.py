import os
import re

NEXT_CONFIG_PATH = '../next.config.ts'

NEW_NEXT_CONFIG = """import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\\n/g, '')
          }
        ],
      },
    ]
  }
};

export default nextConfig;
"""

def update_next_config():
    if not os.path.exists(NEXT_CONFIG_PATH):
        print(f"Error: {NEXT_CONFIG_PATH} not found.")
        return
    with open(NEXT_CONFIG_PATH, 'w', encoding='utf-8') as f:
        f.write(NEW_NEXT_CONFIG)
    print("next.config.ts updated with Phase 2 strict checks and security headers.")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    update_next_config()
