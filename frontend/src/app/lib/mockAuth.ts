// app/lib/mockAuth.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Mock database of users
const MOCK_USERS: User[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    id: 2,
    name: 'John Doe',
    email: 'demo@example.com',
    role: 'user',
  },
  {
    id: 3,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
  },
];

// Mock function to simulate JWT token generation
function generateMockToken(user: User): string {
  // This creates a fake JWT-like token with the user data encoded
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 3600000, // 1 hour from now
  };
  
  // Encode to base64 (simulating JWT)
  const encodedPayload = btoa(JSON.stringify(payload));
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  
  // Create a fake signature (in reality, this would be cryptographically signed)
  const signature = 'mock-signature';
  
  return `${header}.${encodedPayload}.${signature}`;
}

// Mock function to decode a token
export function decodeMockToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

// Mock Login
export async function mockLogin(email: string, password: string): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Find user by email
  const user = MOCK_USERS.find(u => u.email === email);

  // Simulate validation
  if (!user) {
    throw new Error('User not found');
  }

  // For demo purposes, accept any password with a minimum length
  if (!password || password.length < 3) {
    throw new Error('Invalid credentials');
  }

  // If it's the admin account, add admin privileges
  const finalUser = user.role === 'admin' ? user : user;

  const token = generateMockToken(finalUser);

  return {
    access_token: token,
    user: finalUser,
  };
}

// Mock Register
export async function mockRegister(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if user already exists
  if (MOCK_USERS.some(u => u.email === email)) {
    throw new Error('User with this email already exists');
  }

  // Create new user
  const newUser: User = {
    id: MOCK_USERS.length + 1,
    name,
    email,
    role: 'user', // Default role for new registrations
  };

  // Add to mock database (in memory)
  MOCK_USERS.push(newUser);

  const token = generateMockToken(newUser);

  return {
    access_token: token,
    user: newUser,
  };
}

// Mock token validation
export function validateMockToken(token: string | null): User | null {
  if (!token) return null;

  const payload = decodeMockToken(token);
  
  if (!payload) return null;

  // Check if token has expired
  if (payload.exp && payload.exp < Date.now()) {
    return null;
  }

  // Find the user
  const user = MOCK_USERS.find(u => u.email === payload.email);
  
  return user || null;
}