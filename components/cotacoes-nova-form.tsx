/**
 * Cotacoes Nova Form Component
 * @module components/cotacoes-nova-form
 *
 * Wizard form para criar cotacao manual no painel administrativo.
 * Reutiliza os componentes existentes do fluxo publico /cotacao.
 * A cotacao e atribuida diretamente ao seller logado (sem round-robin).
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CotacaoFormVehicle } from "@/components/cotacao-form-vehicle";
import { CotacaoResult } from "@/components/cotacao-result";
import { CotacaoRejected } from "@/components/cotacao-rejected";
import { CotacaoFormCustomer } from "@/components/cotacao-form-customer";
import { WizardSteps, WizardStep } from "@/components/wizard-step";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface CotacoesNovaFormProps {
  sellerId: string; // ID do seller logado para atribuicao direta
}

type Step = "vehicle" | "result" | "rejected" | "customer";

interface VehicleData {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  valorFipe: number;
  codigoFipe: string;
  combustivel: string | null;
  cor: string | null;
  categoria: string;
  tipoUso: string;
  pricing: {
    mensalidade: number;
    adesao: number;
    adesaoDesconto: number;
    cotaParticipacao: number | null;
  };
}

interface RejectionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function CotacoesNovaForm({ sellerId }: CotacoesNovaFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("vehicle");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [rejectionError, setRejectionError] = useState<RejectionError | null>(null);
  const [saveAsLead, setSaveAsLead] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleVehicleSuccess(data: VehicleData) {
    setVehicleData(data);
    setStep("result");
  }

  function handleVehicleRejected(error: RejectionError, canSaveAsLead: boolean) {
    setRejectionError(error);
    setSaveAsLead(canSaveAsLead);
    setStep("rejected");
  }

  function handleContinueToCustomer() {
    setStep("customer");
  }

  function handleCollectLeadData() {
    setStep("customer");
  }

  function handleBackToResult() {
    if (saveAsLead) {
      setStep("rejected");
    } else {
      setStep("result");
    }
  }

  function handleBack() {
    setStep("vehicle");
    setVehicleData(null);
    setRejectionError(null);
    setSaveAsLead(false);
  }

  async function handleCustomerSubmit(customerData: CustomerData) {
    if (!vehicleData) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: {
            placa: vehicleData.placa,
            marca: vehicleData.marca,
            modelo: vehicleData.modelo,
            ano: vehicleData.ano,
            valorFipe: vehicleData.valorFipe,
            codigoFipe: vehicleData.codigoFipe,
            combustivel: vehicleData.combustivel,
            cor: vehicleData.cor,
            categoria: vehicleData.categoria,
            tipoUso: vehicleData.tipoUso,
          },
          customer: customerData,
          pricing: saveAsLead ? undefined : vehicleData.pricing,
          isRejected: saveAsLead,
          rejectionReason: saveAsLead ? rejectionError?.message : undefined,
          sellerId, // Atribui diretamente ao seller logado (bypassa round-robin)
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Cotacao criada com sucesso!");
        router.push(`/cotacoes/${result.data.id}`);
      } else {
        toast.error(result.error?.message || "Erro ao criar cotacao. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao criar cotacao. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStepStatus(targetStep: Step): "idle" | "active" | "completed" {
    const stepOrder: Step[] = ["vehicle", "result", "customer"];
    const currentIndex = stepOrder.indexOf(step === "rejected" ? "result" : step);
    const targetIndex = stepOrder.indexOf(targetStep);

    if (targetIndex < currentIndex) return "completed";
    if (targetIndex === currentIndex) return "active";
    return "idle";
  }

  return (
    <div className="space-y-6">
      {/* Wizard Steps - only show for normal flow */}
      {step !== "rejected" && (
        <Card>
          <CardContent className="py-6">
            <WizardSteps orientation="horizontal" className="max-w-lg mx-auto">
              <WizardStep
                step={1}
                title="Veiculo"
                description="Dados do veiculo"
                status={getStepStatus("vehicle")}
              />
              <WizardStep
                step={2}
                title="Cotacao"
                description="Valores calculados"
                status={getStepStatus("result")}
              />
              <WizardStep
                step={3}
                title="Dados Pessoais"
                description="Finalize a cotacao"
                status={getStepStatus("customer")}
                isLast
              />
            </WizardSteps>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="flex justify-center">
        {step === "vehicle" && (
          <CotacaoFormVehicle
            onSuccess={handleVehicleSuccess}
            onRejected={handleVehicleRejected}
          />
        )}

        {step === "result" && vehicleData && (
          <CotacaoResult
            vehicle={vehicleData}
            onContinue={handleContinueToCustomer}
            onBack={handleBack}
          />
        )}

        {step === "rejected" && rejectionError && (
          <CotacaoRejected
            error={rejectionError}
            saveAsLead={saveAsLead}
            onCollectData={handleCollectLeadData}
            onBack={handleBack}
          />
        )}

        {step === "customer" && (
          <CotacaoFormCustomer
            onSubmit={handleCustomerSubmit}
            onBack={handleBackToResult}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
