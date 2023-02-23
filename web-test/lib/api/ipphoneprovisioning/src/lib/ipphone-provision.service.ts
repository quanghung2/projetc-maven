import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IpPhoneBrand, IPPhoneProvision, SampleData } from './ipphone-provision.model';

@Injectable({
  providedIn: 'root'
})
export class IpPhoneProvisionService {
  constructor(private http: HttpClient) {}

  getTemplate(brand: IpPhoneBrand) {
    return this.http.get<IPPhoneProvision[]>(`ipphoneprovisioning/private/v1/templates/${brand}`);
  }

  createTemplate(req: IPPhoneProvision) {
    return this.http.post<IPPhoneProvision>(`ipphoneprovisioning/private/v1/templates`, req);
  }

  cloneTemplate(req: IPPhoneProvision) {
    return this.http.post<IPPhoneProvision>(`ipphoneprovisioning/private/v1/templates/clone`, req);
  }

  updateTemplate(req: IPPhoneProvision) {
    return this.http.put<IPPhoneProvision>(`ipphoneprovisioning/private/v1/templates`, req);
  }

  deleteTemplate(brand: IpPhoneBrand, model: string) {
    return this.http.delete<IPPhoneProvision[]>(`ipphoneprovisioning/private/v1/templates/${brand}/${model}`);
  }

  getFieldSampleData() {
    return this.http.get<SampleData>('ipphoneprovisioning/private/v1/templates/defaultValue');
  }

  downloadSampleData(brand: IpPhoneBrand, model: string, data: SampleData) {
    return this.http.post(`ipphoneprovisioning/private/v1/templates/${brand}/${model}/sample`, data, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
