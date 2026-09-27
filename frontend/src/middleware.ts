// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 🔥 TEMPORARILY DISABLED FOR DEVELOPMENT
  // Remove this line when backend is ready
  return NextResponse.next();
  
  // ... your actual middleware code below
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};