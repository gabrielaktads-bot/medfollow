export const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const maskCEP = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const maskCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export const maskCRM = (value: string): string => {
  if (!value) return "";
  let raw = value.toUpperCase();
  // Strip the CRM/ prefix so we work only with UF + digits
  if (raw.startsWith("CRM/")) raw = raw.slice(4);
  else if (raw.startsWith("CRM")) raw = raw.slice(3);
  // Remove all separators
  raw = raw.replace(/[\s\-\/]/g, "");
  // UF = first 2 letters; number = up to 6 digits
  const uf = raw.replace(/[^A-Z]/g, "").slice(0, 2);
  const num = raw.replace(/[^0-9]/g, "").slice(0, 6);
  if (!uf) return "";
  if (!num) return `CRM/${uf}`;
  return `CRM/${uf} ${num}`;
};
