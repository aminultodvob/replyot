import { BILLING_PACKAGE_AMOUNT, BILLING_PACKAGE_CURRENCY } from "./billing";

type CreateChargeInput = {
  fullName: string;
  email: string;
  metadata: Record<string, string>;
};

type CreateChargeResponse = {
  status: boolean;
  message: string;
  invoice_id?: string;
  payment_url?: string;
};

type VerifyPaymentResponse = {
  status: boolean;
  message?: string;
  invoice_id?: string;
  transaction_id?: string;
  amount?: string | number;
  currency?: string;
  payment_status?: string;
  metadata?: Record<string, string>;
  full_name?: string;
  email?: string;
};

const getServerConfig = () => {
  const baseUrl = process.env.UDDOKTAPAY_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.UDDOKTAPAY_API_KEY;
  const hostUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("UDDOKTAPAY_BASE_URL is required");
  }

  if (!apiKey) {
    throw new Error("UDDOKTAPAY_API_KEY is required");
  }

  if (!hostUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is required");
  }

  return { baseUrl, apiKey, hostUrl };
};

const request = async <TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> => {
  const { baseUrl, apiKey } = getServerConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "RT-UDDOKTAPAY-API-KEY": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`UddoktaPay request failed: ${response.status} ${errorBody}`);
  }

  return (await response.json()) as TResponse;
};

export const createUddoktaPayCharge = async ({
  fullName,
  email,
  metadata,
}: CreateChargeInput) => {
  const { hostUrl } = getServerConfig();

  return await request<CreateChargeResponse>("/api/checkout-v2", {
    full_name: fullName,
    email,
    amount: BILLING_PACKAGE_AMOUNT,
    metadata,
    redirect_url: `${hostUrl}/payment`,
    cancel_url: `${hostUrl}/payment?cancel=true`,
    webhook_url: `${hostUrl}/api/webhook/uddoktapay`,
    return_type: "GET",
  });
};

export const verifyUddoktaPayPayment = async (invoiceId: string) => {
  return await request<VerifyPaymentResponse>("/api/verify-payment", {
    invoice_id: invoiceId,
  });
};

export const isValidUddoktaPayWebhook = (apiKeyHeader: string | null) => {
  const { apiKey } = getServerConfig();
  return apiKeyHeader === apiKey;
};

export const matchesConfiguredAmount = (amount: string | number | undefined) => {
  if (amount == null) {
    return false;
  }

  return Number(amount) === Number(BILLING_PACKAGE_AMOUNT);
};

export const matchesConfiguredCurrency = (currency: string | undefined) => {
  if (!currency) {
    return true;
  }

  return currency.toUpperCase() === BILLING_PACKAGE_CURRENCY.toUpperCase();
};
