// cache.module.ts

import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

@Module({
  imports: [
    
    CacheModule.register({
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class InMemoryCacheModule {}