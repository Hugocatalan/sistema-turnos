import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from './prisma';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

export async function rateLimit(request: NextRequest): Promise<{
  success: boolean;
  headers: Headers;
}> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const endpoint = request.nextUrl.pathname;

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);

  try {
    const record = await prisma.rateLimit.upsert({
      where: { ip_endpoint: { ip, endpoint } },
      update: {
        count: {
          increment: 1
        },
        windowStart: new Date()
      },
      create: {
        ip,
        endpoint,
        count: 1,
        windowStart: new Date()
      }
    });

    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
      return {
        success: false,
        headers: new Headers({
          'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': '0'
        })
      };
    }

    await prisma.rateLimit.deleteMany({
      where: { windowStart: { lt: windowStart } }
    });

    return {
      success: true,
      headers: new Headers({
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
        'X-RateLimit-Remaining': String(RATE_LIMIT_MAX_REQUESTS - record.count)
      })
    };
  } catch {
    return { success: true, headers: new Headers() };
  }
}

export function createSecurityHeaders(): Headers {
  return new Headers({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  });
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateDNI(dni: string): boolean {
  const cleaned = dni.replace(/[^0-9]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 10;
}

export function validateEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string | null | undefined): boolean {
  if (!phone) return true;
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

export function hashIP(ip: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip + process.env.NEXTAUTH_SECRET).digest('hex');
}
