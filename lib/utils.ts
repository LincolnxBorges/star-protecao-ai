import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number to WhatsApp link (wa.me)
 * Removes all non-digit characters and adds Brazil country code if needed
 * @param phone - Phone number string
 * @param message - Optional message to pre-fill
 * @returns WhatsApp URL string
 */
export function formatWhatsAppLink(phone: string, message?: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Add Brazil country code (55) if not present
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;

  // Build URL with optional message
  const baseUrl = `https://wa.me/${fullNumber}`;

  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }

  return baseUrl;
}

/**
 * Formats a phone number for tel: link
 * @param phone - Phone number string
 * @returns tel: URL string
 */
export function formatTelLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+55${digits}`;
}

/**
 * Formats a phone number for display (Brazilian format)
 * @param phone - Phone number string
 * @returns Formatted phone string
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

/**
 * Copies text to clipboard with fallback for older browsers
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for older browsers using execCommand
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Formats an address into a Google Maps URL
 * @param address - Object containing address components
 * @returns Google Maps URL string
 */
export function formatGoogleMapsUrl(address: {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep?: string;
}): string {
  // Build address string for Google Maps search
  const addressParts = [
    `${address.street}, ${address.number}`,
    address.neighborhood,
    address.city,
    address.state,
    "Brasil",
  ].filter(Boolean);

  const query = encodeURIComponent(addressParts.join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
