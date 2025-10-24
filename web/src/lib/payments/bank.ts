export type BankAccountDetails = {
  bankName?: string | null;
  bankAccountType?: string | null;
  bankAccountNumber?: string | null;
  bankAccountRut?: string | null;
  accountHolder?: string | null;
};

export function maskAccountNumber(account: string | null | undefined): string | null {
  if (!account) return null;
  const trimmed = String(account).replace(/\s+/g, "").trim();
  if (!trimmed) return null;
  if (trimmed.length <= 4) {
    return trimmed;
  }
  return `••••${trimmed.slice(-4)}`;
}

export function summarizeBankDetails(details: BankAccountDetails) {
  const bankName = details.bankName?.trim() ?? "";
  const bankAccountType = details.bankAccountType?.trim() ?? "";
  const accountNumber = details.bankAccountNumber?.trim() ?? "";
  const accountHolder = details.accountHolder?.trim() ?? "";
  const bankAccountRut = details.bankAccountRut?.trim() ?? "";

  const maskedAccountNumber = maskAccountNumber(accountNumber);
  const bankLabel = [bankName, bankAccountType].filter(Boolean).join(" · ");
  const destination = [bankLabel, maskedAccountNumber].filter(Boolean).join(" ").trim() || null;

  const notesParts = [
    accountHolder ? `Titular: ${accountHolder}` : null,
    bankAccountRut ? `RUT: ${bankAccountRut}` : null,
  ].filter(Boolean);

  const missingFields: Array<
    "bankName" | "bankAccountType" | "bankAccountNumber" | "accountHolder" | "bankAccountRut"
  > = [];
  if (!bankName) missingFields.push("bankName");
  if (!bankAccountType) missingFields.push("bankAccountType");
  if (!accountNumber) missingFields.push("bankAccountNumber");
  if (!accountHolder) missingFields.push("accountHolder");
  if (!bankAccountRut) missingFields.push("bankAccountRut");

  return {
    ready: missingFields.length === 0,
    destination,
    maskedAccountNumber,
    notes: notesParts.length > 0 ? notesParts.join(" · ") : null,
    missingFields,
  };
}
