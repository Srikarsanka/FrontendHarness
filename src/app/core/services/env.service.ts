import { Injectable } from '@angular/core';

interface EnvConfig {
  apiUrl: string;
  env: string;
  appName: string;
  [key: string]: string;
}

@Injectable({ providedIn: 'root' })
export class EnvService {
  private readonly env: EnvConfig;

  constructor() {
    this.env = (window as Record<string, unknown>)['__env'] as EnvConfig || {} as EnvConfig;
  }

  get apiUrl(): string {
    return this.env.apiUrl || '/api';
  }

  get environment(): string {
    return this.env.env || 'dev';
  }

  get appName(): string {
    return this.env.appName || 'D&B Task Manager';
  }

  get(key: string): string {
    return this.env[key] || '';
  }
}
