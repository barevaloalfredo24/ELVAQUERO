// =====================================================================
// Tipos de la librería recurrente-checkout (sin tipos propios).
// =====================================================================

declare module "recurrente-checkout" {
  interface RecurrenteCheckoutOptions {
    url: string;
    onSuccess?: (data: unknown) => void;
    onFailure?: (data: unknown) => void;
    onPaymentInProgress?: (data: unknown) => void;
    development?: boolean;
  }
  const RecurrenteCheckout: {
    load: (options: RecurrenteCheckoutOptions) => void;
  };
  export = RecurrenteCheckout;
}
