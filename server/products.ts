export type MarketplaceCheckoutProduct = {
  title: string;
  description?: string | null;
  unitAmountCents: number;
  partySize: number;
};

export function getMarketplaceCheckoutLineItems(product: MarketplaceCheckoutProduct) {
  return [{
    price_data: {
      currency: "usd",
      product_data: {
        name: product.title,
        description: product.description || undefined,
      },
      unit_amount: product.unitAmountCents,
    },
    quantity: product.partySize,
  }];
}
