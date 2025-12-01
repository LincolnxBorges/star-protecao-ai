"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface SettingsLogoUploadProps {
  currentLogo?: string;
  onUploadSuccess: (path: string) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function SettingsLogoUpload({
  currentLogo,
  onUploadSuccess,
  onRemove,
  readOnly = false,
}: SettingsLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Tipo de arquivo invalido. Use JPG, PNG ou WebP.");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Arquivo muito grande. Tamanho maximo: 2MB.");
      return;
    }

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/settings/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      onUploadSuccess(data.path);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/upload-logo", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover logo");
      }

      onRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover logo");
    } finally {
      setIsRemoving(false);
    }
  };

  const displayUrl = previewUrl || currentLogo;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {displayUrl ? (
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={displayUrl}
                alt="Logo da empresa"
                width={96}
                height={96}
                className="h-full w-full object-contain"
              />
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {!readOnly && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRemoving}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {currentLogo ? "Alterar Logo" : "Enviar Logo"}
                </>
              )}
            </Button>

            {currentLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading || isRemoving}
                className="text-destructive hover:text-destructive"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Remover Logo
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Formatos aceitos: JPG, PNG, WebP. Tamanho maximo: 2MB.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
