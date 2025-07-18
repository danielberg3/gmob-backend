import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Armazena um token JWT no cache Redis
   * Usado para controlar tokens válidos e implementar logout
   */
  async setToken(userId: number, token: string, ttl: number = 3600): Promise<void> {
    const key = `jwt:${userId}`;
    await this.cacheManager.set(key, token, ttl);
  }

  /**
   * Recupera um token JWT do cache
   * Usado para validar se o token ainda é válido
   */
  async getToken(userId: number): Promise<string | null> {
    const key = `jwt:${userId}`;
    const token = await this.cacheManager.get(key);
    return typeof token === 'string' ? token : null;
  }

  /**
   * Remove um token do cache (logout)
   */
  async removeToken(userId: number): Promise<void> {
    const key = `jwt:${userId}`;
    await this.cacheManager.del(key);
  }

  /**
   * Armazena dados de sessão temporários
   * Usado para armazenar informações de login temporárias
   */
  async setSession(sessionId: string, data: any, ttl: number = 1800): Promise<void> {
    const key = `session:${sessionId}`;
    await this.cacheManager.set(key, JSON.stringify(data), ttl);
  }

  /**
   * Recupera dados de sessão
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await this.cacheManager.get(key);
    return data ? JSON.parse(data as string) : null;
  }

  /**
   * Remove dados de sessão
   */
  async removeSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.cacheManager.del(key);
  }

  /**
   * Armazena tentativas de login falhadas para implementar rate limiting
   */
  async setLoginAttempts(email: string, attempts: number, ttl: number = 900): Promise<void> {
    const key = `login_attempts:${email}`;
    await this.cacheManager.set(key, attempts, ttl);
  }

  /**
   * Recupera número de tentativas de login
   */
  async getLoginAttempts(email: string): Promise<number> {
    const key = `login_attempts:${email}`;
    const attempts = await this.cacheManager.get(key);
    return attempts ? Number(attempts) : 0;
  }

  /**
   * Remove tentativas de login (após login bem-sucedido)
   */
  async removeLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    await this.cacheManager.del(key);
  }
}

