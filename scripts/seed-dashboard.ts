import "dotenv/config";
import { db } from "../lib/db";
import {
  customers,
  vehicles,
  sellers,
  quotations,
  sellerGoals,
  user,
} from "../lib/schema";
import { eq, sql } from "drizzle-orm";

// ===========================================
// SEED: Dashboard Test Data
// ===========================================

async function seedDashboard() {
  console.log("🌱 Starting dashboard seed...\n");

  // Buscar vendedor existente ou criar um
  console.log("👤 Finding or creating seller...");

  // Primeiro, verificar se existe um user
  const [existingUser] = await db.select().from(user).limit(1);

  let sellerId: string;

  if (!existingUser) {
    console.log("  Creating test user...");
    // Criar um user de teste
    await db.insert(user).values({
      id: "test-user-id",
      name: "Vendedor Teste",
      email: "vendedor@star.com",
      emailVerified: true,
    });
  }

  // Verificar se existe um seller
  const [existingSeller] = await db.select().from(sellers).limit(1);

  if (existingSeller) {
    sellerId = existingSeller.id;
    console.log(`  ✓ Using existing seller: ${existingSeller.name}`);
  } else {
    // Criar seller
    const [newSeller] = await db
      .insert(sellers)
      .values({
        userId: existingUser?.id || "test-user-id",
        name: "Vendedor Teste",
        email: "vendedor@star.com",
        phone: "(11) 99999-9999",
        role: "SELLER",
        status: "ACTIVE",
      })
      .returning();
    sellerId = newSeller.id;
    console.log(`  ✓ Created seller: ${newSeller.name}`);
  }

  // ===========================================
  // CUSTOMERS
  // ===========================================
  console.log("\n👥 Creating customers...");

  const customersData = [
    {
      name: "João Silva",
      email: "joao@email.com",
      phone: "11999998888",
      cpf: "123.456.789-01",
      cep: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    {
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "11988887777",
      cpf: "234.567.890-12",
      cep: "04543-011",
      street: "Av. Brigadeiro Faria Lima",
      number: "2000",
      neighborhood: "Itaim Bibi",
      city: "São Paulo",
      state: "SP",
    },
    {
      name: "Pedro Oliveira",
      email: "pedro@email.com",
      phone: "11977776666",
      cpf: "345.678.901-23",
      cep: "22041-080",
      street: "Av. Atlântica",
      number: "500",
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
    },
    {
      name: "Ana Costa",
      email: "ana@email.com",
      phone: "11966665555",
      cpf: "456.789.012-34",
      cep: "30130-000",
      street: "Av. Afonso Pena",
      number: "1500",
      neighborhood: "Centro",
      city: "Belo Horizonte",
      state: "MG",
    },
    {
      name: "Carlos Ferreira",
      email: "carlos@email.com",
      phone: "11955554444",
      cpf: "567.890.123-45",
      cep: "80060-000",
      street: "Rua XV de Novembro",
      number: "700",
      neighborhood: "Centro",
      city: "Curitiba",
      state: "PR",
    },
  ];

  const createdCustomers: string[] = [];
  for (const data of customersData) {
    // Verificar se já existe pelo CPF
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.cpf, data.cpf))
      .limit(1);

    if (existing) {
      createdCustomers.push(existing.id);
      console.log(`  • ${data.name} (existing)`);
    } else {
      const [created] = await db.insert(customers).values(data).returning();
      createdCustomers.push(created.id);
      console.log(`  ✓ ${data.name}`);
    }
  }

  // ===========================================
  // VEHICLES
  // ===========================================
  console.log("\n🚗 Creating vehicles...");

  const vehiclesData = [
    {
      placa: "ABC1234",
      marca: "VOLKSWAGEN",
      modelo: "GOL",
      ano: "2022",
      valorFipe: "45000.00",
      codigoFipe: "005339-1",
      combustivel: "Flex",
      cor: "Branco",
      categoria: "NORMAL" as const,
      tipoUso: "PARTICULAR" as const,
    },
    {
      placa: "DEF5678",
      marca: "FIAT",
      modelo: "STRADA",
      ano: "2023",
      valorFipe: "85000.00",
      codigoFipe: "001267-3",
      combustivel: "Flex",
      cor: "Prata",
      categoria: "UTILITARIO" as const,
      tipoUso: "COMERCIAL" as const,
    },
    {
      placa: "GHI9012",
      marca: "HONDA",
      modelo: "CIVIC",
      ano: "2021",
      valorFipe: "120000.00",
      codigoFipe: "014068-8",
      combustivel: "Flex",
      cor: "Preto",
      categoria: "NORMAL" as const,
      tipoUso: "PARTICULAR" as const,
    },
    {
      placa: "JKL3456",
      marca: "YAMAHA",
      modelo: "MT-07",
      ano: "2023",
      valorFipe: "48000.00",
      codigoFipe: "815018-0",
      combustivel: "Gasolina",
      cor: "Azul",
      categoria: "MOTO" as const,
      tipoUso: "PARTICULAR" as const,
    },
    {
      placa: "MNO7890",
      marca: "TOYOTA",
      modelo: "COROLLA",
      ano: "2024",
      valorFipe: "140000.00",
      codigoFipe: "025050-1",
      combustivel: "Híbrido",
      cor: "Cinza",
      categoria: "ESPECIAL" as const,
      tipoUso: "PARTICULAR" as const,
    },
  ];

  const createdVehicles: string[] = [];
  for (const data of vehiclesData) {
    // Verificar se já existe pela placa
    const [existing] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.placa, data.placa))
      .limit(1);

    if (existing) {
      createdVehicles.push(existing.id);
      console.log(`  • ${data.marca} ${data.modelo} (existing)`);
    } else {
      const [created] = await db.insert(vehicles).values(data).returning();
      createdVehicles.push(created.id);
      console.log(`  ✓ ${data.marca} ${data.modelo}`);
    }
  }

  // ===========================================
  // QUOTATIONS
  // ===========================================
  console.log("\n📋 Creating quotations...");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const quotationsData = [
    {
      customerId: createdCustomers[0],
      vehicleId: createdVehicles[0],
      sellerId: sellerId,
      mensalidade: "201.67",
      adesao: "500.00",
      adesaoDesconto: "250.00",
      status: "PENDING" as const,
      createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
      expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // expira amanhã
    },
    {
      customerId: createdCustomers[1],
      vehicleId: createdVehicles[1],
      sellerId: sellerId,
      mensalidade: "283.39",
      adesao: "600.00",
      adesaoDesconto: "300.00",
      status: "CONTACTED" as const,
      createdAt: yesterday,
      expiresAt: new Date(today.getTime() + 48 * 60 * 60 * 1000),
      contactedAt: new Date(yesterday.getTime() + 4 * 60 * 60 * 1000),
    },
    {
      customerId: createdCustomers[2],
      vehicleId: createdVehicles[2],
      sellerId: sellerId,
      mensalidade: "377.61",
      adesao: "700.00",
      adesaoDesconto: "350.00",
      status: "ACCEPTED" as const,
      createdAt: twoDaysAgo,
      acceptedAt: yesterday,
      contactedAt: twoDaysAgo,
    },
    {
      customerId: createdCustomers[3],
      vehicleId: createdVehicles[3],
      sellerId: sellerId,
      mensalidade: "309.00",
      adesao: "400.00",
      adesaoDesconto: "200.00",
      status: "PENDING" as const,
      createdAt: new Date(twoDaysAgo.getTime() - 26 * 60 * 60 * 1000), // >24h sem contato
      expiresAt: today, // expira hoje!
    },
    {
      customerId: createdCustomers[4],
      vehicleId: createdVehicles[4],
      sellerId: sellerId,
      mensalidade: "455.09",
      adesao: "800.00",
      adesaoDesconto: "400.00",
      status: "REJECTED" as const,
      createdAt: twoDaysAgo,
      rejectionReason: "Cliente optou por outra proteção",
    },
  ];

  for (const data of quotationsData) {
    const [created] = await db.insert(quotations).values(data).returning();
    console.log(`  ✓ Cotação ${created.id.slice(0, 8)}... - ${data.status}`);
  }

  // ===========================================
  // SELLER GOAL
  // ===========================================
  console.log("\n🎯 Creating seller goal...");

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Verificar se já existe meta
  const [existingGoal] = await db
    .select()
    .from(sellerGoals)
    .where(eq(sellerGoals.sellerId, sellerId))
    .limit(1);

  if (existingGoal) {
    // Atualizar meta existente
    await db
      .update(sellerGoals)
      .set({
        month: currentMonth,
        year: currentYear,
        targetAccepted: 30,
      })
      .where(eq(sellerGoals.id, existingGoal.id));
    console.log(`  ✓ Updated goal: 30 cotações aceitas/mês`);
  } else {
    await db.insert(sellerGoals).values({
      sellerId: sellerId,
      month: currentMonth,
      year: currentYear,
      targetAccepted: 30,
    });
    console.log(`  ✓ Created goal: 30 cotações aceitas/mês`);
  }

  // ===========================================
  // VERIFICATION
  // ===========================================
  console.log("\n📊 Summary:");

  const quotationStats = await db
    .select({
      status: quotations.status,
      count: sql<number>`count(*)`,
    })
    .from(quotations)
    .where(eq(quotations.sellerId, sellerId))
    .groupBy(quotations.status);

  console.log("\n  Quotations by status:");
  for (const stat of quotationStats) {
    console.log(`    ${stat.status}: ${stat.count}`);
  }

  const [goalInfo] = await db
    .select()
    .from(sellerGoals)
    .where(eq(sellerGoals.sellerId, sellerId))
    .limit(1);

  console.log(`\n  Monthly Goal: ${goalInfo?.targetAccepted || 0} accepted quotations`);

  console.log("\n✅ Dashboard seed completed successfully!");
  console.log("\n🔗 Access the dashboard at: http://localhost:3000/dashboard");
}

seedDashboard()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
