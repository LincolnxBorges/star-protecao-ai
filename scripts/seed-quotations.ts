import "dotenv/config";
import { db } from "../lib/db";
import {
  customers,
  vehicles,
  quotations,
  sellers,
  quotationActivities,
} from "../lib/schema";
import { eq } from "drizzle-orm";

// ===========================================
// SEED: 10 Cotações com dados reais
// ===========================================

const customersData = [
  {
    name: "João Carlos Silva",
    email: "joao.silva@gmail.com",
    phone: "(11) 98765-4321",
    cpf: "123.456.789-09",
    cep: "01310-100",
    street: "Avenida Paulista",
    number: "1000",
    complement: "Apto 101",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  },
  {
    name: "Maria Fernanda Costa",
    email: "maria.costa@hotmail.com",
    phone: "(21) 99876-5432",
    cpf: "987.654.321-00",
    cep: "22041-080",
    street: "Rua Barata Ribeiro",
    number: "500",
    complement: null,
    neighborhood: "Copacabana",
    city: "Rio de Janeiro",
    state: "RJ",
  },
  {
    name: "Pedro Henrique Oliveira",
    email: "pedro.oliveira@yahoo.com",
    phone: "(31) 97654-3210",
    cpf: "456.789.123-45",
    cep: "30130-000",
    street: "Praça Sete de Setembro",
    number: "200",
    complement: "Sala 302",
    neighborhood: "Centro",
    city: "Belo Horizonte",
    state: "MG",
  },
  {
    name: "Ana Paula Santos",
    email: "ana.santos@gmail.com",
    phone: "(41) 96543-2109",
    cpf: "321.654.987-12",
    cep: "80010-000",
    street: "Rua XV de Novembro",
    number: "700",
    complement: null,
    neighborhood: "Centro",
    city: "Curitiba",
    state: "PR",
  },
  {
    name: "Lucas Rodrigues Almeida",
    email: "lucas.almeida@outlook.com",
    phone: "(51) 95432-1098",
    cpf: "654.321.987-65",
    cep: "90010-000",
    street: "Rua dos Andradas",
    number: "1500",
    complement: "Cobertura",
    neighborhood: "Centro Histórico",
    city: "Porto Alegre",
    state: "RS",
  },
  {
    name: "Juliana Martins Pereira",
    email: "juliana.pereira@gmail.com",
    phone: "(85) 94321-0987",
    cpf: "789.123.456-78",
    cep: "60060-440",
    street: "Avenida Beira Mar",
    number: "3000",
    complement: null,
    neighborhood: "Meireles",
    city: "Fortaleza",
    state: "CE",
  },
  {
    name: "Rafael Lima Souza",
    email: "rafael.souza@hotmail.com",
    phone: "(71) 93210-9876",
    cpf: "234.567.890-23",
    cep: "40020-000",
    street: "Avenida Sete de Setembro",
    number: "800",
    complement: "Loja 5",
    neighborhood: "Centro",
    city: "Salvador",
    state: "BA",
  },
  {
    name: "Camila Ferreira Gomes",
    email: "camila.gomes@yahoo.com",
    phone: "(62) 92109-8765",
    cpf: "567.890.123-56",
    cep: "74003-010",
    street: "Avenida Goiás",
    number: "1200",
    complement: null,
    neighborhood: "Setor Central",
    city: "Goiânia",
    state: "GO",
  },
  {
    name: "Fernando Barbosa Nunes",
    email: "fernando.nunes@gmail.com",
    phone: "(81) 91098-7654",
    cpf: "890.123.456-89",
    cep: "50030-230",
    street: "Avenida Conde da Boa Vista",
    number: "600",
    complement: "Apto 502",
    neighborhood: "Boa Vista",
    city: "Recife",
    state: "PE",
  },
  {
    name: "Beatriz Cardoso Ribeiro",
    email: "beatriz.ribeiro@outlook.com",
    phone: "(48) 90987-6543",
    cpf: "012.345.678-01",
    cep: "88010-000",
    street: "Rua Felipe Schmidt",
    number: "450",
    complement: null,
    neighborhood: "Centro",
    city: "Florianópolis",
    state: "SC",
  },
];

// Veículos com placas no formato Mercosul e dados realistas
const vehiclesData = [
  {
    placa: "BRA2E19",
    marca: "VOLKSWAGEN",
    modelo: "GOL 1.0 MPI",
    ano: "2022/2023",
    valorFipe: "58900.00",
    codigoFipe: "005527-0",
    combustivel: "Flex",
    cor: "Branco",
    categoria: "NORMAL" as const,
    tipoUso: "PARTICULAR" as const,
  },
  {
    placa: "RIO4F22",
    marca: "FIAT",
    modelo: "ARGO 1.0 DRIVE",
    ano: "2023/2023",
    valorFipe: "72500.00",
    codigoFipe: "001318-0",
    combustivel: "Flex",
    cor: "Prata",
    categoria: "NORMAL" as const,
    tipoUso: "PARTICULAR" as const,
  },
  {
    placa: "MER3C05",
    marca: "CHEVROLET",
    modelo: "ONIX 1.0 TURBO LT",
    ano: "2023/2024",
    valorFipe: "85000.00",
    codigoFipe: "004549-0",
    combustivel: "Flex",
    cor: "Cinza",
    categoria: "NORMAL" as const,
    tipoUso: "PARTICULAR" as const,
  },
  {
    placa: "SUL1A15",
    marca: "HYUNDAI",
    modelo: "HB20 1.0 SENSE",
    ano: "2022/2022",
    valorFipe: "64800.00",
    codigoFipe: "009236-0",
    combustivel: "Flex",
    cor: "Vermelho",
    categoria: "NORMAL" as const,
    tipoUso: "COMERCIAL" as const,
  },
  {
    placa: "NOR5G30",
    marca: "TOYOTA",
    modelo: "HILUX CD 4X4 SRV",
    ano: "2023/2023",
    valorFipe: "285000.00",
    codigoFipe: "009066-0",
    combustivel: "Diesel",
    cor: "Preto",
    categoria: "UTILITARIO" as const,
    tipoUso: "COMERCIAL" as const,
  },
  {
    placa: "CEN2B18",
    marca: "HONDA",
    modelo: "CG 160 FAN",
    ano: "2023/2024",
    valorFipe: "14500.00",
    codigoFipe: "811064-5",
    combustivel: "Flex",
    cor: "Vermelho",
    categoria: "MOTO" as const,
    tipoUso: "PARTICULAR" as const,
  },
  {
    placa: "EST8H42",
    marca: "JEEP",
    modelo: "COMPASS LIMITED 2.0",
    ano: "2022/2023",
    valorFipe: "178000.00",
    codigoFipe: "025173-6",
    combustivel: "Flex",
    cor: "Branco",
    categoria: "UTILITARIO" as const,
    tipoUso: "PARTICULAR" as const,
  },
  {
    placa: "OES6D25",
    marca: "RENAULT",
    modelo: "KWID ZEN 1.0",
    ano: "2023/2023",
    valorFipe: "52000.00",
    codigoFipe: "038003-6",
    combustivel: "Flex",
    cor: "Azul",
    categoria: "NORMAL" as const,
    tipoUso: "COMERCIAL" as const,
  },
  {
    placa: "PAU7E33",
    marca: "YAMAHA",
    modelo: "FAZER 250 ABS",
    ano: "2024/2024",
    valorFipe: "22800.00",
    codigoFipe: "821148-7",
    combustivel: "Gasolina",
    cor: "Azul",
    categoria: "MOTO" as const,
    tipoUso: "PARTICULAR" as const,
  },
  {
    placa: "FLO9A11",
    marca: "FORD",
    modelo: "RANGER XLT 3.2 CD",
    ano: "2021/2022",
    valorFipe: "245000.00",
    codigoFipe: "015083-0",
    combustivel: "Diesel",
    cor: "Prata",
    categoria: "UTILITARIO" as const,
    tipoUso: "COMERCIAL" as const,
  },
];

// Status variados para as cotações
const quotationStatuses = [
  "PENDING",
  "PENDING",
  "CONTACTED",
  "CONTACTED",
  "ACCEPTED",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
  "REJECTED",
  "PENDING",
] as const;

// Calcular mensalidade baseado no valor FIPE (simplificado)
function calculateMensalidade(valorFipe: number, categoria: string): number {
  const percentuais: Record<string, number> = {
    NORMAL: 0.004,
    ESPECIAL: 0.005,
    UTILITARIO: 0.0045,
    MOTO: 0.006,
  };
  const percentual = percentuais[categoria] || 0.004;
  return Math.round(valorFipe * percentual * 100) / 100;
}

async function seedQuotations() {
  console.log("📋 Creating 10 quotations with real data...\n");

  // Buscar vendedores existentes
  const existingSellers = await db.select().from(sellers).where(eq(sellers.status, "ACTIVE"));

  if (existingSellers.length === 0) {
    console.error("❌ No active sellers found. Run db:create-users-api first.");
    process.exit(1);
  }

  console.log(`👥 Found ${existingSellers.length} active sellers`);

  // Limpar cotações existentes (cascade vai limpar activities)
  console.log("🗑️  Cleaning existing quotations, vehicles, customers...");
  await db.delete(quotationActivities);
  await db.delete(quotations);
  await db.delete(vehicles);
  await db.delete(customers);

  const createdCustomerIds: string[] = [];
  const createdVehicleIds: string[] = [];

  // Criar clientes
  console.log("\n👤 Creating customers...");
  for (const customer of customersData) {
    const [created] = await db.insert(customers).values(customer).returning({ id: customers.id });
    createdCustomerIds.push(created.id);
    console.log(`  ✓ ${customer.name}`);
  }

  // Criar veículos
  console.log("\n🚗 Creating vehicles...");
  for (const vehicle of vehiclesData) {
    const [created] = await db.insert(vehicles).values(vehicle).returning({ id: vehicles.id });
    createdVehicleIds.push(created.id);
    console.log(`  ✓ ${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})`);
  }

  // Criar cotações
  console.log("\n💰 Creating quotations...");
  const now = new Date();

  for (let i = 0; i < 10; i++) {
    const vehicle = vehiclesData[i];
    const valorFipe = parseFloat(vehicle.valorFipe);
    const mensalidade = calculateMensalidade(valorFipe, vehicle.categoria);
    const adesao = Math.round(valorFipe * 0.03 * 100) / 100; // 3% do valor FIPE
    const adesaoDesconto = Math.round(adesao * 0.5 * 100) / 100; // 50% de desconto
    const status = quotationStatuses[i];

    // Distribuir entre vendedores (round-robin)
    const seller = existingSellers[i % existingSellers.length];

    // Datas baseadas no status
    const createdAt = new Date(now.getTime() - (10 - i) * 24 * 60 * 60 * 1000); // Últimos 10 dias
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 dias

    let contactedAt = null;
    let acceptedAt = null;

    if (["CONTACTED", "ACCEPTED", "REJECTED"].includes(status)) {
      contactedAt = new Date(createdAt.getTime() + 1 * 24 * 60 * 60 * 1000); // +1 dia
    }
    if (status === "ACCEPTED") {
      acceptedAt = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 dias
    }

    const rejectionReason = status === "REJECTED" ? "Cliente optou por outra proteção" : null;

    const [quotation] = await db
      .insert(quotations)
      .values({
        customerId: createdCustomerIds[i],
        vehicleId: createdVehicleIds[i],
        sellerId: seller.id,
        mensalidade: mensalidade.toFixed(2),
        adesao: adesao.toFixed(2),
        adesaoDesconto: adesaoDesconto.toFixed(2),
        cotaParticipacao: (valorFipe * 0.02).toFixed(2), // 2% participação
        status,
        rejectionReason,
        createdAt,
        expiresAt,
        contactedAt,
        acceptedAt,
        notes: null,
      })
      .returning({ id: quotations.id });

    // Criar atividades para a cotação
    await db.insert(quotationActivities).values({
      quotationId: quotation.id,
      type: "CREATION",
      description: "Cotação criada pelo sistema",
      authorName: "Sistema",
      createdAt,
    });

    if (contactedAt) {
      await db.insert(quotationActivities).values({
        quotationId: quotation.id,
        type: "WHATSAPP_SENT",
        description: "Mensagem enviada via WhatsApp",
        authorName: seller.name,
        createdAt: contactedAt,
      });
    }

    if (status === "ACCEPTED") {
      await db.insert(quotationActivities).values({
        quotationId: quotation.id,
        type: "STATUS_CHANGE",
        description: "Cotação aceita pelo cliente",
        authorName: seller.name,
        createdAt: acceptedAt!,
      });
    }

    console.log(
      `  ✓ #${i + 1} ${vehicle.marca} ${vehicle.modelo} - R$ ${mensalidade.toFixed(2)}/mês [${status}] → ${seller.name}`
    );
  }

  // Resumo
  console.log("\n📊 Summary:");
  console.log(`  Customers: 10`);
  console.log(`  Vehicles: 10`);
  console.log(`  Quotations: 10`);

  const statusCount = quotationStatuses.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log("\n  Status distribution:");
  for (const [status, count] of Object.entries(statusCount)) {
    console.log(`    ${status}: ${count}`);
  }

  console.log("\n✅ Quotations seed completed!");
}

seedQuotations()
  .catch((err) => {
    console.error("❌ Quotations seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
