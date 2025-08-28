// app/_auth/AuthProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

type Role = 'admin' | 'staff' | 'client';
interface User {
  email: string;
  role: Role;
  verified: boolean;
}
interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function normalizeRole(raw: any): Role {
  const validRoles = ['admin', 'staff', 'client'] as const;
  if (!validRoles.includes(raw)) {
    console.warn(`Invalid role "${raw}" received; defaulting to "client"`);
    return 'client';
  }
  return raw;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded: { email: string; role: string; verified?: boolean } = jwtDecode(token);
        if (!decoded.email || !decoded.role) {
          throw new Error('Invalid token payload: missing email or role');
        }
        const safeUser: User = {
          email: decoded.email,
          role: normalizeRole(decoded.role),
          verified: !!decoded.verified,
        };
        setUser(safeUser);
        localStorage.setItem('user', JSON.stringify(safeUser));
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Error loading user from token:', error);
      localStorage.clear();
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (!data?.token) throw new Error('Invalid API response: missing token');

      const decoded: { email: string; role: string; verified?: boolean } = jwtDecode(data.token);
      if (!decoded.email || !decoded.role) throw new Error('Invalid token payload: missing email or role');

      const role = normalizeRole(decoded.role);
      const verified = decoded.verified ?? true;

      if (data.role && data.role !== decoded.role) {
        console.warn(`API role "${data.role}" does not match token role "${decoded.role}"`);
      }

      localStorage.setItem('token', data.token);
      const u: User = { email: decoded.email, role, verified };
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      if (!verified) toast.error('Please verify your email first.');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials');
    }
  }

  async function signup(email: string, password: string) {
    try {
      const { data } = await api.post('/auth/register', { email, password });
      if (!data?.token) throw new Error('Invalid API response: missing token');

      const decoded: { email: string; role: string; verified?: boolean } = jwtDecode(data.token);
      if (!decoded.email || !decoded.role) throw new Error('Invalid token payload: missing email or role');

      const role = normalizeRole(decoded.role);
      const verified = decoded.verified ?? true;

      if (data.role && data.role !== decoded.role) {
        console.warn(`API role "${data.role}" does not match token role "${decoded.role}"`);
      }

      localStorage.setItem('token', data.token);
      const u: User = { email: decoded.email, role, verified };
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      toast.success('Account created.');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed');
    }
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    window.location.href = '/';
  }

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}
