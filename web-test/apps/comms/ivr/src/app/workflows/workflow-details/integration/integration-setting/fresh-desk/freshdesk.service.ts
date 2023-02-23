import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const requiredFieldTypes = ['ticket_type', 'group', 'status', 'priority', 'product'];

export class FreshdeskTickedField {
  id: number;
  name: string;
  label: string;
  choices: any;
  type: string;
  nested_ticket_fields: any[];
  default: boolean;

  get isStatus() {
    return this.name === requiredFieldTypes[2];
  }

  get isNestedTicketFields() {
    return this.type === 'nested_field';
  }

  get isRequired(): boolean {
    return requiredFieldTypes.indexOf(this.name) > -1;
  }

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

@Injectable({ providedIn: 'root' })
export class FreshdeskService {
  constructor(private http: HttpClient) {}

  fetchTickedFields(subdomain, apiKey: string): Observable<FreshdeskTickedField[]> {
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', btoa(`${apiKey}:X`));

    return this.http
      .get<FreshdeskTickedField[]>(`https://${subdomain}.freshdesk.com/api/v2/ticket_fields`, { headers: headers })
      .pipe(
        map(list =>
          list
            .filter(
              field =>
                !['subject', 'requester', 'description', 'company', 'agent', 'source'].includes(field['name']) &&
                !['custom_checkbox'].includes(field['type'])
            )
            .map(field => new FreshdeskTickedField(field))
        )
      );
  }
}
