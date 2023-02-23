import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ActionContactModel,
  ContactUser,
  CreateOrUpdateEndPoint,
  EnumParamsCreateContact,
  EnumTypeActionContact,
  IntegrationModel,
  ParamsRequestContract
} from './integration.model';

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private isCRM: boolean;

  constructor(private http: HttpClient) {}

  getIntegrationStatus(): Observable<IntegrationModel> {
    if (this.isCRM == null) {
      const url = `integration/private/v1/crm/integration-status`;
      return this.http.get<IntegrationModel>(url).pipe(
        map(res => new IntegrationModel(res)),
        tap(integration => {
          // cache isCrm
          this.isCRM = integration.crmIntegrated;
        })
      );
    }
    return of(
      new IntegrationModel({
        crmIntegrated: this.isCRM
      })
    );
  }

  createorUpdateContactByEndpoint(
    orgUuid: string,
    endpoint: CreateOrUpdateEndPoint,
    params: ParamsRequestContract
  ): Observable<any> {
    const body = {};
    endpoint.params.map(item => {
      if (item === EnumParamsCreateContact.orgUuid) {
        body[item] = orgUuid;
      } else if (item === EnumParamsCreateContact.properties) {
        body[item] = params.properties?.map(x => {
          return { name: x.name, value: x.value };
        });
      } else if (item === EnumParamsCreateContact.contactId) {
        body[item] = params.contactId;
      } else if (item === EnumParamsCreateContact.phoneNumber) {
        body[item] = params.phoneNumber;
      } else if (item === EnumParamsCreateContact.txnUuid) {
        body[item] = params.txnUuid;
      }
    });
    return this.http.post<any>(endpoint.url, body);
  }

  fetchDataFromCRM(body: ContactUser): Observable<ActionContactModel[]> {
    const url = 'intelligence-gateway/crm/private/v1/handle-inbound';
    return this.http
      .post<ActionContactModel[]>(url, body)
      .pipe(
        map((res: any) =>
          res
            .map(item => new ActionContactModel(item))
            .filter(
              item =>
                item.code === EnumTypeActionContact.Create ||
                item.code === EnumTypeActionContact.CreateTicket ||
                item.code === EnumTypeActionContact.Display ||
                item.code === EnumTypeActionContact.ErrorCreate
            )
        )
      );
  }
}
