import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private cacheService: CacheService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    // Verifica se o token ainda está válido no cache Redis
    const cachedToken = await this.cacheService.getToken(payload.sub);
    if (!cachedToken) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // Busca o usuário no banco de dados
    const user = await this.prismaService.corretor.findUnique({
      where: { corretor_id: payload.sub },
      select: {
        corretor_id: true,
        nome_completo: true,
        email: true,
        telefone: true,
        cpf: true,
        perfil: true,
        data_cadastro: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }
}

