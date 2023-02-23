export class OrderItem {
  constructor(public productId: string, public sku: string, public saleModel: string, public quantity: number) {}
}

export class OrderRequest {
  shippingAddress: string;
  orderItems: OrderItem[];
}
