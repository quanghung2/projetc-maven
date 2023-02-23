import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CountryMapping, TaxVatConfig } from './../models/tax-vat-config.model';
import { PrivateHttpService } from './private-http.service';

@Injectable({ providedIn: 'root' })
export class TaxService extends PrivateHttpService {
  constructor(private httpClient: HttpClient) {
    super();
  }

  getAllVatConfigs(): Observable<Array<TaxVatConfig>> {
    return this.httpClient
      .get<any>(this.constructFinalEndpoint('/tax/private/v1/vats/sellers'))
      .pipe(map((res: Array<Object>) => res.map(o => new TaxVatConfig(o))));
  }

  addVatConfig(countryCode: string, taxNumber: string, taxable: boolean) {
    const payload = {
      countryCode: countryCode,
      taxNumber: taxNumber,
      taxable: taxable
    };

    return this.httpClient.post(this.constructFinalEndpoint('/tax/private/v1/vats/sellers'), payload);
  }

  updateVatConfig(countryCode: string, taxNumber, taxable: boolean) {
    const payload = {
      taxNumber: taxNumber,
      taxable: taxable
    };

    return this.httpClient.put(
      this.constructFinalEndpoint(`/tax/private/v1/vats/sellers/countries/${countryCode}`),
      payload
    );
  }

  getCountriesMapping(countryCode: string): Observable<CountryMapping> {
    return this.httpClient.get<CountryMapping>(`/tax/private/v1/vats/sellers/countries/${countryCode}/oversea-mapping`);
  }

  updateCountriesMapping(countryCode: string, body: CountryMapping) {
    if (body.forAllNotSpecified) body.applicableCountries = [];
    return this.httpClient.post(`/tax/private/v1/vats/sellers/countries/${countryCode}/oversea-mapping`, body);
  }
}
