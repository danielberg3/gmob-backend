import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCorretorDto } from './dto/create-corretor.dto';
import { UpdateCorretorDto } from './dto/update-corretor.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CorretorService {
  constructor(private prismaService: PrismaService) {}

  async create(createCorretorDto: CreateCorretorDto, currentUser: any) {
    // Apenas administradores podem criar outros corretores
    if (currentUser.perfil !== 'administrador') {
      throw new ForbiddenException('Apenas administradores podem criar corretores');
    }

    const { email, cpf, senha, ...userData } = createCorretorDto;

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

    return corretor;
  }

  async findAll(currentUser: any, page: number = 1, limit: number = 10) {
    // Apenas administradores podem listar todos os corretores
    if (currentUser.perfil !== 'administrador') {
      throw new ForbiddenException('Apenas administradores podem listar corretores');
    }

    const skip = (page - 1) * limit;

    const [corretores, total] = await Promise.all([
      this.prismaService.corretor.findMany({
        skip,
        take: limit,
        select: {
          corretor_id: true,
          nome_completo: true,
          email: true,
          telefone: true,
          cpf: true,
          perfil: true,
          data_cadastro: true,
        },
        orderBy: {
          data_cadastro: 'desc',
        },
      }),
      this.prismaService.corretor.count(),
    ]);

    return {
      corretores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, currentUser: any) {
    // Corretores podem ver apenas seu próprio perfil, administradores podem ver qualquer um
    if (currentUser.perfil !== 'administrador' && currentUser.corretor_id !== id) {
      throw new ForbiddenException('Você só pode visualizar seu próprio perfil');
    }

    const corretor = await this.prismaService.corretor.findUnique({
      where: { corretor_id: id },
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

    if (!corretor) {
      throw new NotFoundException('Corretor não encontrado');
    }

    return corretor;
  }

  async update(id: number, updateCorretorDto: UpdateCorretorDto, currentUser: any) {
    // Corretores podem atualizar apenas seu próprio perfil, administradores podem atualizar qualquer um
    if (currentUser.perfil !== 'administrador' && currentUser.corretor_id !== id) {
      throw new ForbiddenException('Você só pode atualizar seu próprio perfil');
    }

    // Verifica se o corretor existe
    const existingCorretor = await this.prismaService.corretor.findUnique({
      where: { corretor_id: id },
    });

    if (!existingCorretor) {
      throw new NotFoundException('Corretor não encontrado');
    }

    const { email, cpf, senha, ...userData } = updateCorretorDto;

    // Verifica se email já existe (se está sendo alterado)
    if (email && email !== existingCorretor.email) {
      const existingEmail = await this.prismaService.corretor.findUnique({
        where: { email },
      });

      if (existingEmail) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Verifica se CPF já existe (se está sendo alterado)
    if (cpf && cpf !== existingCorretor.cpf) {
      const existingCpf = await this.prismaService.corretor.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        throw new ConflictException('CPF já está em uso');
      }
    }

    // Prepara dados para atualização
    const updateData: any = { ...userData };
    
    if (email) updateData.email = email;
    if (cpf) updateData.cpf = cpf;
    
    // Hash da nova senha se fornecida
    if (senha) {
      updateData.senha = await bcrypt.hash(senha, 12);
    }

    // Atualiza o corretor
    const corretor = await this.prismaService.corretor.update({
      where: { corretor_id: id },
      data: updateData,
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

    return corretor;
  }

  async remove(id: number, currentUser: any) {
    // Apenas administradores podem remover corretores
    if (currentUser.perfil !== 'administrador') {
      throw new ForbiddenException('Apenas administradores podem remover corretores');
    }

    // Verifica se o corretor existe
    const existingCorretor = await this.prismaService.corretor.findUnique({
      where: { corretor_id: id },
    });

    if (!existingCorretor) {
      throw new NotFoundException('Corretor não encontrado');
    }

    // Não permite remover o próprio usuário
    if (currentUser.corretor_id === id) {
      throw new ForbiddenException('Você não pode remover seu próprio usuário');
    }

    await this.prismaService.corretor.delete({
      where: { corretor_id: id },
    });

    return {
      message: 'Corretor removido com sucesso',
    };
  }
}

