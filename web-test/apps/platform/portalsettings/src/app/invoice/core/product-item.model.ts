export class ProductItem {
  public productId: string;
  public sku: string;
  public saleModel: string;
  public productName: string;
  public skuName: string;

  constructor(product?: string, sku?: string, saleModel?: string, productName?: string, skuName?: string) {
    this.productId = product;
    this.sku = sku;
    this.saleModel = saleModel;
    this.productName = productName;
    this.skuName = skuName;
  }
}
