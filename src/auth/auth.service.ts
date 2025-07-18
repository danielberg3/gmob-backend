import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private cacheService: CacheService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, cpf, senha, ...userData } = registerDto;

    // Verifica se email já existe
    const existingEmail = await this.prismaService.corretor.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Email já está em uso');
    }

    // Verifica se CPF já existe
    const existingCpf = await this.prismaService.corretor.findUnique({
      where: { cpf },
    });

    if (existingCpf) {
      throw new ConflictException('CPF já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    // Cria o corretor
    const corretor = await this.prismaService.corretor.create({
      data: {
        ...userData,
        email,
        cpf,
        senha: hashedPassword,
      },
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

    return {
      message: 'Corretor registrado com sucesso',
      corretor,
    };
  }

  async validateUser(email: string, senha: string): Promise<any> {
    // Verifica tentativas de login no Redis
    const attempts = await this.cacheService.getLoginAttempts(email);
    if (attempts >= 5) {
      throw new BadRequestException('Muitas tentativas de login. Tente novamente em 15 minutos.');
    }

    const user = await this.prismaService.corretor.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(senha, user.senha))) {
      // Remove tentativas de login após sucesso
      await this.cacheService.removeLoginAttempts(email);
      
      const { senha: _, ...result } = user;
      return result;
    }

    // Incrementa tentativas de login falhadas
    await this.cacheService.setLoginAttempts(email, attempts + 1, 900); // 15 minutos
    
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.corretor_id,
      perfil: user.perfil 
    };
    
    const token = this.jwtService.sign(payload);
    
    // Armazena o token no Redis com TTL de 7 dias (mesmo tempo do JWT)
    await this.cacheService.setToken(user.corretor_id, token, 7 * 24 * 3600);

    return {
      access_token: token,
      user: {
        corretor_id: user.corretor_id,
        nome_completo: user.nome_completo,
        email: user.email,
        telefone: user.telefone,
        cpf: user.cpf,
        perfil: user.perfil,
        data_cadastro: user.data_cadastro,
      },
    };
  }

  async logout(userId: number) {
    // Remove o token do Redis
    await this.cacheService.removeToken(userId);
    
    return {
      message: 'Logout realizado com sucesso',
    };
  }

  async getProfile(userId: number) {
    const user = await this.prismaService.corretor.findUnique({
      where: { corretor_id: userId },
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

