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
// SEED: 50 Cotações (10 por mês, Jul-Nov 2025)
// ===========================================

// Nomes brasileiros realistas
const firstNames = [
  "João", "Maria", "Pedro", "Ana", "Lucas", "Juliana", "Rafael", "Camila",
  "Fernando", "Beatriz", "Carlos", "Patricia", "Ricardo", "Fernanda", "Marcos",
  "Aline", "Bruno", "Larissa", "Diego", "Mariana", "Gustavo", "Amanda",
  "Rodrigo", "Vanessa", "Felipe", "Tatiana", "André", "Cristina", "Thiago",
  "Débora", "Vinícius", "Renata", "Daniel", "Isabela", "Eduardo", "Priscila",
  "Leandro", "Gabriela", "Alexandre", "Bianca", "Marcelo", "Carolina",
  "Roberto", "Letícia", "Paulo", "Natália", "Henrique", "Simone", "Fábio", "Michele"
];

const lastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
  "Araújo", "Melo", "Barbosa", "Cardoso", "Nascimento", "Rocha", "Correia",
  "Dias", "Teixeira", "Nunes", "Mendes", "Freitas", "Vieira", "Moreira",
  "Monteiro", "Castro", "Campos", "Pinto", "Lopes", "Borges", "Ramos"
];

// Cidades brasileiras com CEPs reais
const cities = [
  { city: "São Paulo", state: "SP", cep: "01310-100", neighborhood: "Bela Vista", street: "Avenida Paulista" },
  { city: "Rio de Janeiro", state: "RJ", cep: "22041-080", neighborhood: "Copacabana", street: "Rua Barata Ribeiro" },
  { city: "Belo Horizonte", state: "MG", cep: "30130-000", neighborhood: "Centro", street: "Praça Sete de Setembro" },
  { city: "Curitiba", state: "PR", cep: "80010-000", neighborhood: "Centro", street: "Rua XV de Novembro" },
  { city: "Porto Alegre", state: "RS", cep: "90010-000", neighborhood: "Centro Histórico", street: "Rua dos Andradas" },
  { city: "Salvador", state: "BA", cep: "40020-000", neighborhood: "Centro", street: "Avenida Sete de Setembro" },
  { city: "Fortaleza", state: "CE", cep: "60060-440", neighborhood: "Meireles", street: "Avenida Beira Mar" },
  { city: "Recife", state: "PE", cep: "50030-230", neighborhood: "Boa Vista", street: "Avenida Conde da Boa Vista" },
  { city: "Brasília", state: "DF", cep: "70040-010", neighborhood: "Asa Sul", street: "SCS Quadra 1" },
  { city: "Goiânia", state: "GO", cep: "74003-010", neighborhood: "Setor Central", street: "Avenida Goiás" },
];

// Veículos com dados realistas
const vehicleModels = [
  // NORMAL - Carros populares
  { marca: "VOLKSWAGEN", modelo: "GOL 1.0 MPI", valorBase: 58000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "FIAT", modelo: "ARGO 1.0 DRIVE", valorBase: 72000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "CHEVROLET", modelo: "ONIX 1.0 TURBO LT", valorBase: 85000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "HYUNDAI", modelo: "HB20 1.0 SENSE", valorBase: 64000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "RENAULT", modelo: "KWID ZEN 1.0", valorBase: 52000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "TOYOTA", modelo: "COROLLA GLI 2.0", valorBase: 145000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "HONDA", modelo: "CIVIC EXL", valorBase: 165000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "NISSAN", modelo: "VERSA SENSE", valorBase: 95000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "PEUGEOT", modelo: "208 ACTIVE", valorBase: 78000, categoria: "NORMAL" as const, combustivel: "Flex" },
  { marca: "CITROEN", modelo: "C3 FEEL", valorBase: 82000, categoria: "NORMAL" as const, combustivel: "Flex" },

  // ESPECIAL - Uso comercial
  { marca: "FIAT", modelo: "STRADA FREEDOM", valorBase: 98000, categoria: "ESPECIAL" as const, combustivel: "Flex" },
  { marca: "VOLKSWAGEN", modelo: "SAVEIRO ROBUST", valorBase: 92000, categoria: "ESPECIAL" as const, combustivel: "Flex" },
  { marca: "CHEVROLET", modelo: "MONTANA LS", valorBase: 115000, categoria: "ESPECIAL" as const, combustivel: "Flex" },

  // UTILITARIO - SUVs e Caminhonetes
  { marca: "TOYOTA", modelo: "HILUX CD 4X4 SRV", valorBase: 285000, categoria: "UTILITARIO" as const, combustivel: "Diesel" },
  { marca: "FORD", modelo: "RANGER XLT 3.2 CD", valorBase: 245000, categoria: "UTILITARIO" as const, combustivel: "Diesel" },
  { marca: "JEEP", modelo: "COMPASS LIMITED 2.0", valorBase: 178000, categoria: "UTILITARIO" as const, combustivel: "Flex" },
  { marca: "CHEVROLET", modelo: "TRACKER LTZ", valorBase: 145000, categoria: "UTILITARIO" as const, combustivel: "Flex" },
  { marca: "HYUNDAI", modelo: "CRETA PLATINUM", valorBase: 165000, categoria: "UTILITARIO" as const, combustivel: "Flex" },
  { marca: "VOLKSWAGEN", modelo: "T-CROSS HIGHLINE", valorBase: 155000, categoria: "UTILITARIO" as const, combustivel: "Flex" },
  { marca: "NISSAN", modelo: "KICKS ADVANCE", valorBase: 135000, categoria: "UTILITARIO" as const, combustivel: "Flex" },

  // MOTO
  { marca: "HONDA", modelo: "CG 160 FAN", valorBase: 14500, categoria: "MOTO" as const, combustivel: "Flex" },
  { marca: "YAMAHA", modelo: "FAZER 250 ABS", valorBase: 22800, categoria: "MOTO" as const, combustivel: "Gasolina" },
  { marca: "HONDA", modelo: "CB 500F", valorBase: 35000, categoria: "MOTO" as const, combustivel: "Gasolina" },
  { marca: "YAMAHA", modelo: "MT-03 ABS", valorBase: 32000, categoria: "MOTO" as const, combustivel: "Gasolina" },
  { marca: "HONDA", modelo: "PCX 160", valorBase: 18000, categoria: "MOTO" as const, combustivel: "Gasolina" },
];

const cores = ["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Bege"];
const anos = ["2021/2022", "2022/2022", "2022/2023", "2023/2023", "2023/2024", "2024/2024"];

// Status distribution por mês (mais realista)
const statusDistributionByMonth: Record<number, Array<typeof quotationStatuses[number]>> = {
  7: ["ACCEPTED", "ACCEPTED", "ACCEPTED", "CONTACTED", "CONTACTED", "EXPIRED", "EXPIRED", "REJECTED", "CANCELLED", "PENDING"], // Julho - mais antigo, mais resolvido
  8: ["ACCEPTED", "ACCEPTED", "CONTACTED", "CONTACTED", "CONTACTED", "EXPIRED", "REJECTED", "CANCELLED", "PENDING", "PENDING"], // Agosto
  9: ["ACCEPTED", "ACCEPTED", "CONTACTED", "CONTACTED", "CONTACTED", "REJECTED", "PENDING", "PENDING", "PENDING", "PENDING"], // Setembro
  10: ["ACCEPTED", "CONTACTED", "CONTACTED", "CONTACTED", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING"], // Outubro
  11: ["CONTACTED", "CONTACTED", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING"], // Novembro - mais recente, mais pendente
};

const quotationStatuses = ["PENDING", "CONTACTED", "ACCEPTED", "EXPIRED", "CANCELLED", "REJECTED"] as const;

// Gerar CPF formatado (fictício mas com formato válido)
function generateCPF(index: number): string {
  const base = (index * 111111111 + 12345678).toString().padStart(9, "0").slice(0, 9);
  return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${(index % 99).toString().padStart(2, "0")}`;
}

// Gerar placa Mercosul
function generatePlaca(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const l1 = letters[index % 26];
  const l2 = letters[(index * 3) % 26];
  const l3 = letters[(index * 7) % 26];
  const n1 = index % 10;
  const l4 = letters[(index * 11) % 26];
  const n2 = (index * 2) % 10;
  const n3 = (index * 3) % 10;
  return `${l1}${l2}${l3}${n1}${l4}${n2}${n3}`;
}

// Gerar código FIPE fictício
function generateCodigoFipe(index: number): string {
  return `${(index * 1234 + 1000).toString().padStart(6, "0")}-${index % 10}`;
}

// Calcular mensalidade baseado no valor FIPE
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

async function seedMonthlyQuotations() {
  console.log("📋 Creating 50 quotations (10 per month, Jul-Nov 2025)...\n");

  // Buscar vendedores existentes
  const existingSellers = await db.select().from(sellers).where(eq(sellers.status, "ACTIVE"));

  if (existingSellers.length === 0) {
    console.error("❌ No active sellers found. Run db:create-users-api first.");
    process.exit(1);
  }

  console.log(`👥 Found ${existingSellers.length} active sellers:`);
  existingSellers.forEach(s => console.log(`   - ${s.name} (${s.role})`));

  // Limpar dados existentes
  console.log("\n🗑️  Cleaning existing data...");
  await db.delete(quotationActivities);
  await db.delete(quotations);
  await db.delete(vehicles);
  await db.delete(customers);

  const months = [7, 8, 9, 10, 11]; // Julho a Novembro
  const year = 2025;
  let totalQuotations = 0;
  let globalIndex = 0;

  for (const month of months) {
    console.log(`\n📅 Month ${month}/${year}:`);
    const statuses = statusDistributionByMonth[month];

    for (let i = 0; i < 10; i++) {
      globalIndex++;

      // Criar cliente
      const firstName = firstNames[globalIndex % firstNames.length];
      const lastName = lastNames[(globalIndex * 3) % lastNames.length];
      const middleName = lastNames[(globalIndex * 7) % lastNames.length];
      const cityData = cities[globalIndex % cities.length];

      const [customer] = await db.insert(customers).values({
        name: `${firstName} ${middleName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${globalIndex}@email.com`,
        phone: `(${11 + (globalIndex % 89)}) 9${(globalIndex * 1111).toString().slice(0, 4)}-${(globalIndex * 2222).toString().slice(0, 4)}`,
        cpf: generateCPF(globalIndex),
        cep: cityData.cep,
        street: cityData.street,
        number: ((globalIndex * 100) % 2000 + 100).toString(),
        complement: globalIndex % 3 === 0 ? `Apto ${globalIndex * 10 + 1}` : null,
        neighborhood: cityData.neighborhood,
        city: cityData.city,
        state: cityData.state,
      }).returning({ id: customers.id });

      // Criar veículo
      const vehicleModel = vehicleModels[globalIndex % vehicleModels.length];
      const valorFipe = vehicleModel.valorBase + (globalIndex * 500) % 10000;
      const tipoUso = vehicleModel.categoria === "ESPECIAL" || globalIndex % 4 === 0 ? "COMERCIAL" : "PARTICULAR";

      const [vehicle] = await db.insert(vehicles).values({
        placa: generatePlaca(globalIndex),
        marca: vehicleModel.marca,
        modelo: vehicleModel.modelo,
        ano: anos[globalIndex % anos.length],
        valorFipe: valorFipe.toFixed(2),
        codigoFipe: generateCodigoFipe(globalIndex),
        combustivel: vehicleModel.combustivel,
        cor: cores[globalIndex % cores.length],
        categoria: vehicleModel.categoria,
        tipoUso: tipoUso as "PARTICULAR" | "COMERCIAL",
      }).returning({ id: vehicles.id });

      // Calcular valores
      const mensalidade = calculateMensalidade(valorFipe, vehicleModel.categoria);
      const adesao = Math.round(valorFipe * 0.03 * 100) / 100;
      const adesaoDesconto = Math.round(adesao * 0.5 * 100) / 100;
      const status = statuses[i];

      // Distribuir entre vendedores
      const seller = existingSellers[(globalIndex + month) % existingSellers.length];

      // Datas baseadas no mês
      const dayOfMonth = Math.min(1 + (i * 3), 28);
      const createdAt = new Date(year, month - 1, dayOfMonth, 10 + (i % 8), (i * 15) % 60);
      const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      let contactedAt = null;
      let acceptedAt = null;

      if (["CONTACTED", "ACCEPTED", "REJECTED"].includes(status)) {
        contactedAt = new Date(createdAt.getTime() + (1 + (i % 2)) * 24 * 60 * 60 * 1000);
      }
      if (status === "ACCEPTED") {
        acceptedAt = new Date(createdAt.getTime() + (2 + (i % 3)) * 24 * 60 * 60 * 1000);
      }

      const rejectionReason = status === "REJECTED"
        ? ["Cliente optou por outra proteção", "Valor acima do orçamento", "Desistiu da compra do veículo"][i % 3]
        : null;

      const [quotation] = await db.insert(quotations).values({
        customerId: customer.id,
        vehicleId: vehicle.id,
        sellerId: seller.id,
        mensalidade: mensalidade.toFixed(2),
        adesao: adesao.toFixed(2),
        adesaoDesconto: adesaoDesconto.toFixed(2),
        cotaParticipacao: (valorFipe * 0.02).toFixed(2),
        status,
        rejectionReason,
        createdAt,
        expiresAt,
        contactedAt,
        acceptedAt,
        notes: null,
      }).returning({ id: quotations.id });

      // Criar atividades
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

      if (status === "ACCEPTED" && acceptedAt) {
        await db.insert(quotationActivities).values({
          quotationId: quotation.id,
          type: "STATUS_CHANGE",
          description: "Cotação aceita pelo cliente",
          authorName: seller.name,
          createdAt: acceptedAt,
        });
      }

      totalQuotations++;
      console.log(`   ✓ ${vehicleModel.marca} ${vehicleModel.modelo} - R$ ${mensalidade.toFixed(2)}/mês [${status}] → ${seller.name}`);
    }
  }

  // Resumo por mês e status
  console.log("\n📊 Summary by Month:");
  for (const month of months) {
    const statuses = statusDistributionByMonth[month];
    const statusCount = statuses.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n   ${month}/${year}:`);
    for (const [status, count] of Object.entries(statusCount)) {
      console.log(`      ${status}: ${count}`);
    }
  }

  // Resumo geral
  const allStatuses = months.flatMap(m => statusDistributionByMonth[m]);
  const totalByStatus = allStatuses.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("\n📈 Total Summary:");
  console.log(`   Total Quotations: ${totalQuotations}`);
  console.log(`   Total Customers: ${totalQuotations}`);
  console.log(`   Total Vehicles: ${totalQuotations}`);
  console.log("\n   Status Distribution:");
  for (const [status, count] of Object.entries(totalByStatus)) {
    console.log(`      ${status}: ${count}`);
  }

  console.log("\n✅ Monthly quotations seed completed!");
}

seedMonthlyQuotations()
  .catch((err) => {
    console.error("❌ Monthly quotations seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
