export class ByoiRoute {
  backupVendor: string;
  destPrefix: string;
  domain: string;
  id: number;
  orgName: string;
  orgUuid: string;
  productCode: string;
  sku: string;
  skuName: string;
  srcMatchingType: string;
  srcPrefix: string;
  vendor: string;
  vendorLabel: string;
  enableMnpCheck: boolean;
  fallbackVendorLabel: string;

  constructor(byoiRoutes?: Partial<ByoiRoute>) {
    Object.assign(this, byoiRoutes);
  }
}
