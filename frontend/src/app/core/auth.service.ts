import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface Family {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'parent';
  family: Family | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  family_name: string;
  consent: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly userSignal = signal<AuthUser | null>(null);

  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /**
   * Sanctum requires a CSRF cookie before any stateful POST.
   * Call this once before login or register.
   */
  async csrf(): Promise<void> {
    await firstValueFrom(this.http.get('/sanctum/csrf-cookie'));
  }

  async register(payload: RegisterPayload): Promise<AuthUser> {
    await this.csrf();
    await firstValueFrom(this.http.post('/api/register', payload));
    return this.fetchMe();
  }

  async login(payload: LoginPayload): Promise<AuthUser> {
    await this.csrf();
    await firstValueFrom(this.http.post('/api/login', payload));
    return this.fetchMe();
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/logout', {}));
    this.userSignal.set(null);
  }

  async fetchMe(): Promise<AuthUser> {
    const user = await firstValueFrom(this.http.get<AuthUser>('/api/me'));
    this.userSignal.set(user);
    return user;
  }

  async refresh(): Promise<void> {
    try {
      await this.fetchMe();
    } catch {
      this.userSignal.set(null);
    }
  }
}
