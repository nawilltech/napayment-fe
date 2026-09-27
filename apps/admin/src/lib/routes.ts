/** Admin console paths, defined once - nav, pages, redirects and revalidation all use these. */
export const ROUTES = {
  configuration: "/configuration",
  paymentProcessors: "/configuration/payment-processors",
  paymentProcessor: (id: string) => `/configuration/payment-processors/${id}`,
  collectionAccount: "/configuration/collection-account",
  business: (id: string) => `/businesses/${id}`,
} as const;
