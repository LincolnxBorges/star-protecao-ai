/**
 * Customers Context
 * @module lib/customers
 */

import { db } from "@/lib/db";
import { customers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { formatCpf } from "@/lib/validations/cpf";

// ===========================================
// Types
// ===========================================

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ViaCepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

// ===========================================
// ViaCEP Integration
// ===========================================

export async function lookupCep(cep: string): Promise<ViaCepResult | null> {
  const normalizedCep = cep.replace(/\D/g, "");

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${normalizedCep}/json/`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch {
    return null;
  }
}

// ===========================================
// Customer CRUD
// ===========================================

export async function findOrCreateByCpf(data: CustomerData): Promise<Customer> {
  const formattedCpf = formatCpf(data.cpf);

  // Check if customer exists
  const existing = await db
    .select()
    .from(customers)
    .where(eq(customers.cpf, formattedCpf));

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new customer
  const [customer] = await db
    .insert(customers)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone.replace(/\D/g, ""),
      cpf: formattedCpf,
      cep: data.cep.replace(/\D/g, ""),
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state.toUpperCase(),
    })
    .returning();

  return customer;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const results = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  return results[0] || null;
}

export async function getCustomerByCpf(cpf: string): Promise<Customer | null> {
  const formattedCpf = formatCpf(cpf);

  const results = await db
    .select()
    .from(customers)
    .where(eq(customers.cpf, formattedCpf));

  return results[0] || null;
}
