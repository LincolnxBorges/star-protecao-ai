import "dotenv/config";
import { db } from "../lib/db";
import { pricingRules, blacklist, roundRobinConfig } from "../lib/schema";
import { sql } from "drizzle-orm";

// ===========================================
// SEED: Pricing Rules & Blacklist
// ===========================================

async function seed() {
  console.log("🌱 Starting seed...\n");

  // Limpar dados existentes
  console.log("🗑️  Cleaning existing data...");
  await db.delete(pricingRules);
  await db.delete(blacklist);
  await db.delete(roundRobinConfig);

  // ===========================================
  // PRICING RULES
  // ===========================================
  console.log("💰 Inserting pricing rules...");

  // NORMAL (Veículos leves - uso particular)
  const normalRules = [
    { faixaMin: "0", faixaMax: "10000.00", mensalidade: "95.00" },
    { faixaMin: "10000.01", faixaMax: "20000.00", mensalidade: "117.27" },
    { faixaMin: "20000.01", faixaMax: "30000.00", mensalidade: "143.29" },
    { faixaMin: "30000.01", faixaMax: "40000.00", mensalidade: "168.29" },
    { faixaMin: "40000.01", faixaMax: "50000.00", mensalidade: "201.67" },
    { faixaMin: "50000.01", faixaMax: "60000.00", mensalidade: "226.32" },
    { faixaMin: "60000.01", faixaMax: "70000.00", mensalidade: "248.23" },
    { faixaMin: "70000.01", faixaMax: "80000.00", mensalidade: "271.05" },
    { faixaMin: "80000.01", faixaMax: "90000.00", mensalidade: "300.12" },
    { faixaMin: "90000.01", faixaMax: "100000.00", mensalidade: "325.95" },
    { faixaMin: "100000.01", faixaMax: "110000.00", mensalidade: "351.78" },
    { faixaMin: "110000.01", faixaMax: "120000.00", mensalidade: "377.61" },
    { faixaMin: "120000.01", faixaMax: "130000.00", mensalidade: "403.43" },
    { faixaMin: "130000.01", faixaMax: "140000.00", mensalidade: "429.26" },
    { faixaMin: "140000.01", faixaMax: "150000.00", mensalidade: "455.09" },
    { faixaMin: "150000.01", faixaMax: "160000.00", mensalidade: "480.92" },
    { faixaMin: "160000.01", faixaMax: "170000.00", mensalidade: "506.75" },
    { faixaMin: "170000.01", faixaMax: "180000.00", mensalidade: "532.58" },
    { faixaMin: "180000.01", faixaMax: "999999999.99", mensalidade: "558.41" },
  ];

  for (const rule of normalRules) {
    await db.insert(pricingRules).values({
      categoria: "NORMAL",
      ...rule,
    });
  }
  console.log(`  ✓ NORMAL: ${normalRules.length} faixas`);

  // ESPECIAL (Veículos leves - uso comercial)
  const especialRules = [
    { faixaMin: "0", faixaMax: "20000.00", mensalidade: "151.04" },
    { faixaMin: "20000.01", faixaMax: "30000.00", mensalidade: "194.91" },
    { faixaMin: "30000.01", faixaMax: "40000.00", mensalidade: "222.37" },
    { faixaMin: "40000.01", faixaMax: "50000.00", mensalidade: "259.43" },
    { faixaMin: "50000.01", faixaMax: "60000.00", mensalidade: "284.13" },
    { faixaMin: "60000.01", faixaMax: "70000.00", mensalidade: "322.57" },
    { faixaMin: "70000.01", faixaMax: "80000.00", mensalidade: "363.75" },
    { faixaMin: "80000.01", faixaMax: "90000.00", mensalidade: "413.75" },
    { faixaMin: "90000.01", faixaMax: "100000.00", mensalidade: "463.75" },
    { faixaMin: "100000.01", faixaMax: "110000.00", mensalidade: "513.75" },
    { faixaMin: "110000.01", faixaMax: "120000.00", mensalidade: "563.75" },
    { faixaMin: "120000.01", faixaMax: "130000.00", mensalidade: "613.75" },
    { faixaMin: "130000.01", faixaMax: "140000.00", mensalidade: "663.75" },
    { faixaMin: "140000.01", faixaMax: "150000.00", mensalidade: "713.75" },
    { faixaMin: "150000.01", faixaMax: "160000.00", mensalidade: "763.75" },
    { faixaMin: "160000.01", faixaMax: "170000.00", mensalidade: "813.75" },
    { faixaMin: "170000.01", faixaMax: "180000.00", mensalidade: "863.75" },
    { faixaMin: "180000.01", faixaMax: "190000.00", mensalidade: "913.75" },
    { faixaMin: "190000.01", faixaMax: "999999999.99", mensalidade: "963.75" },
  ];

  for (const rule of especialRules) {
    await db.insert(pricingRules).values({
      categoria: "ESPECIAL",
      ...rule,
    });
  }
  console.log(`  ✓ ESPECIAL: ${especialRules.length} faixas`);

  // UTILITARIO (SUVs, Caminhonetes, Vans)
  const utilitarioRules = [
    { faixaMin: "0", faixaMax: "25000.00", mensalidade: "124.20" },
    { faixaMin: "25000.01", faixaMax: "50000.00", mensalidade: "184.14" },
    { faixaMin: "50000.01", faixaMax: "75000.00", mensalidade: "235.65" },
    { faixaMin: "75000.01", faixaMax: "100000.00", mensalidade: "283.39" },
    { faixaMin: "100000.01", faixaMax: "125000.00", mensalidade: "353.74" },
    { faixaMin: "125000.01", faixaMax: "150000.00", mensalidade: "424.09" },
    { faixaMin: "150000.01", faixaMax: "175000.00", mensalidade: "495.00" },
    { faixaMin: "175000.01", faixaMax: "200000.00", mensalidade: "566.00" },
    { faixaMin: "200000.01", faixaMax: "225000.00", mensalidade: "637.00" },
    { faixaMin: "225000.01", faixaMax: "250000.00", mensalidade: "708.00" },
    { faixaMin: "250000.01", faixaMax: "275000.00", mensalidade: "760.49" },
    { faixaMin: "275000.01", faixaMax: "300000.00", mensalidade: "825.83" },
    { faixaMin: "300000.01", faixaMax: "325000.00", mensalidade: "891.17" },
    { faixaMin: "325000.01", faixaMax: "350000.00", mensalidade: "956.51" },
    { faixaMin: "350000.01", faixaMax: "375000.00", mensalidade: "1021.85" },
    { faixaMin: "375000.01", faixaMax: "400000.00", mensalidade: "1087.19" },
    { faixaMin: "400000.01", faixaMax: "425000.00", mensalidade: "1152.53" },
    { faixaMin: "425000.01", faixaMax: "450000.00", mensalidade: "1217.87" },
    { faixaMin: "450000.01", faixaMax: "999999999.99", mensalidade: "1283.22" },
  ];

  for (const rule of utilitarioRules) {
    await db.insert(pricingRules).values({
      categoria: "UTILITARIO",
      ...rule,
    });
  }
  console.log(`  ✓ UTILITARIO: ${utilitarioRules.length} faixas`);

  // MOTO (Motocicletas)
  const motoRules = [
    { faixaMin: "0", faixaMax: "6000.00", mensalidade: "79.35" },
    { faixaMin: "6000.01", faixaMax: "10000.00", mensalidade: "104.94" },
    { faixaMin: "10000.01", faixaMax: "16000.00", mensalidade: "129.29" },
    { faixaMin: "16000.01", faixaMax: "20000.00", mensalidade: "159.00" },
    { faixaMin: "20000.01", faixaMax: "26000.00", mensalidade: "189.00" },
    { faixaMin: "26000.01", faixaMax: "30000.00", mensalidade: "214.32" },
    { faixaMin: "30000.01", faixaMax: "36000.00", mensalidade: "249.00" },
    { faixaMin: "36000.01", faixaMax: "40000.00", mensalidade: "279.00" },
    { faixaMin: "40000.01", faixaMax: "46000.00", mensalidade: "309.00" },
    { faixaMin: "46000.01", faixaMax: "50000.00", mensalidade: "339.00" },
    { faixaMin: "50000.01", faixaMax: "56000.00", mensalidade: "369.00" },
    { faixaMin: "56000.01", faixaMax: "60000.00", mensalidade: "399.00" },
    { faixaMin: "60000.01", faixaMax: "66000.00", mensalidade: "429.00" },
    { faixaMin: "66000.01", faixaMax: "70000.00", mensalidade: "459.00" },
    { faixaMin: "70000.01", faixaMax: "76000.00", mensalidade: "489.00" },
    { faixaMin: "76000.01", faixaMax: "80000.00", mensalidade: "519.00" },
    { faixaMin: "80000.01", faixaMax: "86000.00", mensalidade: "549.00" },
    { faixaMin: "86000.01", faixaMax: "90000.00", mensalidade: "579.00" },
    { faixaMin: "90000.01", faixaMax: "999999999.99", mensalidade: "609.00" },
  ];

  for (const rule of motoRules) {
    await db.insert(pricingRules).values({
      categoria: "MOTO",
      ...rule,
    });
  }
  console.log(`  ✓ MOTO: ${motoRules.length} faixas`);

  // ===========================================
  // BLACKLIST
  // ===========================================
  console.log("\n🚫 Inserting blacklist...");

  // Marcas completas
  const blacklistedBrands = [
    { marca: "AUDI", motivo: "Não trabalhamos com esta marca" },
    { marca: "BMW", motivo: "Não trabalhamos com esta marca" },
    { marca: "MERCEDES-BENZ", motivo: "Não trabalhamos com esta marca" },
    { marca: "MERCEDES", motivo: "Não trabalhamos com esta marca" },
    { marca: "VOLVO", motivo: "Não trabalhamos com esta marca" },
    { marca: "LEXUS", motivo: "Não trabalhamos com esta marca" },
    { marca: "JAGUAR", motivo: "Não trabalhamos com esta marca" },
    { marca: "PORSCHE", motivo: "Não trabalhamos com esta marca" },
    { marca: "LAND ROVER", motivo: "Não trabalhamos com esta marca" },
    { marca: "LAND-ROVER", motivo: "Não trabalhamos com esta marca" },
  ];

  for (const item of blacklistedBrands) {
    await db.insert(blacklist).values(item);
  }
  console.log(`  ✓ Marcas bloqueadas: ${blacklistedBrands.length}`);

  // Modelos específicos
  const blacklistedModels = [
    { marca: "FORD", modelo: "FOCUS", motivo: "Não trabalhamos com este modelo" },
    { marca: "FORD", modelo: "FUSION", motivo: "Não trabalhamos com este modelo" },
    { marca: "CITROEN", modelo: "CACTUS", motivo: "Não trabalhamos com este modelo" },
    { marca: "CITROËN", modelo: "CACTUS", motivo: "Não trabalhamos com este modelo" },
    { marca: "HYUNDAI", modelo: "ELANTRA", motivo: "Não trabalhamos com este modelo" },
    { marca: "HONDA", modelo: "ACCORD", motivo: "Não trabalhamos com este modelo" },
  ];

  for (const item of blacklistedModels) {
    await db.insert(blacklist).values(item);
  }
  console.log(`  ✓ Modelos bloqueados: ${blacklistedModels.length}`);

  // ===========================================
  // ROUND ROBIN CONFIG
  // ===========================================
  console.log("\n🔄 Inserting round-robin config...");
  await db.insert(roundRobinConfig).values({
    currentIndex: 0,
  });
  console.log("  ✓ Round-robin config initialized");

  // ===========================================
  // VERIFICATION
  // ===========================================
  console.log("\n📊 Verification:");

  const pricingCount = await db
    .select({
      categoria: pricingRules.categoria,
      count: sql<number>`count(*)`,
      min: sql<number>`min(${pricingRules.mensalidade})`,
      max: sql<number>`max(${pricingRules.mensalidade})`
    })
    .from(pricingRules)
    .groupBy(pricingRules.categoria);

  console.log("\n  Pricing Rules:");
  for (const row of pricingCount) {
    console.log(`    ${row.categoria}: ${row.count} faixas (R$ ${row.min} - R$ ${row.max})`);
  }

  const blacklistCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(blacklist);
  console.log(`\n  Blacklist: ${blacklistCount[0].count} items`);

  console.log("\n✅ Seed completed successfully!");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
