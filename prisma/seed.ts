import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  // Cadastrar tipos de imóveis

  const tiposImoveisData = [
    { nome_tipo: 'Apartamento' },
    { nome_tipo: 'Casa' },
    { nome_tipo: 'Cobertura' },
    { nome_tipo: 'Terreno' },
    { nome_tipo: 'Comercial' },
  ];

  for (const data of tiposImoveisData) {
    try {
      await prisma.tipoImovel.upsert({
        where: { nome_tipo: data.nome_tipo },
        update: {},
        create: data,
      });
      console.log(`TipoImovel "${data.nome_tipo}" upserted.`);
    } catch (e) {
      console.error(`Erro ao upsert TipoImovel "${data.nome_tipo}":`, e);
    }
  }

  // Cadastrar Imóveis

  const imoveisData: Prisma.ImovelCreateInput[] = [
    {
      corretor: { connect: { corretor_id: 1 } },
      tipo_imovel: { connect: { nome_tipo: 'Apartamento' } },
      status: 'disponivel',
      estado: 'Alagoas',
      cidade: 'Maceió',
      rua: 'Rua das Palmeiras',
      numero: '123',
      complemento: 'Apto 501',
      valor: new Prisma.Decimal('350000.00'),
      area: new Prisma.Decimal('75.50'),
      numero_comodos: 3,
      descricao: 'Apartamento espaçoso com vista para o mar, dois quartos e uma suíte.',
    },
    {
      corretor: { connect: { corretor_id: 1 } },
      tipo_imovel: { connect: { nome_tipo: 'Casa' } },
      status: 'vendido',
      estado: 'Alagoas',
      cidade: 'Rio Largo',
      rua: 'Travessa dos Cajueiros',
      numero: '45',
      complemento: null,
      valor: new Prisma.Decimal('280000.00'),
      area: new Prisma.Decimal('120.00'),
      numero_comodos: 4,
      descricao: 'Casa térrea com quintal grande e churrasqueira, ideal para família.',
    },
    {
      corretor: { connect: { corretor_id: 1 } },
      tipo_imovel: { connect: { nome_tipo: 'Apartamento' } },
      status: 'alugado',
      estado: 'Alagoas',
      cidade: 'Marechal Deodoro',
      rua: 'Avenida Atlântica',
      numero: '789',
      complemento: 'Bloco B, Apto 203',
      valor: new Prisma.Decimal('1800.00'),
      area: new Prisma.Decimal('60.00'),
      numero_comodos: 2,
      descricao: 'Apartamento mobiliado, próximo à praia do Francês, com um quarto e sacada.',
    },
    {
      corretor: { connect: { corretor_id: 1 } },
      tipo_imovel: { connect: { nome_tipo: 'Terreno' } },
      status: 'disponivel',
      estado: 'Alagoas',
      cidade: 'Arapiraca',
      rua: 'Rua das Flores',
      numero: 'S/N',
      complemento: null,
      valor: new Prisma.Decimal('95000.00'),
      area: new Prisma.Decimal('250.00'),
      numero_comodos: 0,
      descricao: 'Terreno plano em área de expansão urbana, ótimo para construção.',
    },
    {
      corretor: { connect: { corretor_id: 1 } },
      tipo_imovel: { connect: { nome_tipo: 'Cobertura' } },
      status: 'disponivel',
      estado: 'Alagoas',
      cidade: 'Maceió',
      rua: 'Avenida Beira Mar',
      numero: '500',
      complemento: 'Cobertura 1201',
      valor: new Prisma.Decimal('1200000.00'),
      area: new Prisma.Decimal('180.00'),
      numero_comodos: 5,
      descricao: 'Cobertura luxuosa com piscina privativa e vista panorâmica para o oceano.',
    },
    {
      corretor: { connect: { corretor_id: 1 } },
      tipo_imovel: { connect: { nome_tipo: 'Comercial' } },
      status: 'disponivel',
      estado: 'Alagoas',
      cidade: 'Palmeira dos Índios',
      rua: 'Rua do Comércio',
      numero: '10',
      complemento: 'Loja 1',
      valor: new Prisma.Decimal('4500.00'),
      area: new Prisma.Decimal('80.00'),
      numero_comodos: 1,
      descricao: 'Ponto comercial com ótima localização no centro da cidade, ideal para pequenos negócios.',
    },
  ];

  for (const data of imoveisData) {
    try {
      const existingImovel = await prisma.imovel.findUnique({
        where: {
          rua_numero_complemento: {
            rua: data.rua,
            numero: data.numero,
            complemento: data.complemento || '',
          },
        },
      });

      if (!existingImovel) {
        await prisma.imovel.create({ data });
        console.log(`Imóvel "${data.rua}, ${data.numero}" criado.`);
      } else {
        await prisma.imovel.update({
          where: { imovel_id: existingImovel.imovel_id },
          data,
        });
        console.log(`Imóvel "${data.rua}, ${data.numero}" atualizado.`);
      }
    } catch (e) {
      console.error(`Erro ao upsert Imóvel "${data.rua}, ${data.numero}":`, e);
    }
  }

  console.log('Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});