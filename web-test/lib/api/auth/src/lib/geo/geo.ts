export class GeoCountryResponse {
  prefix: string;
  countryName: string;
  countryCode: string;
  ipAddress: string;
  isDefault: boolean;

  constructor(response?: any) {
    Object.assign(this, response);
  }

  get standardPrefix(): string {
    return '+' + this.prefix;
  }
}

export function createGeoCountry(params: Partial<GeoCountryResponse>) {
  return new GeoCountryResponse(params);
}

export class MetadataTxnWidget extends GeoCountryResponse {
  currentVisit: string;
  title: string;
  device: string;
  browser: string;
}
