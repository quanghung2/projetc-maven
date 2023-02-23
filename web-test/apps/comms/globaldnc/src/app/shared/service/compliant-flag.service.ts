import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CompliantFlagService {
  infoCompliant: InfoCompliantModel;
  constructor(private http: HttpClient) {}

  getInfoCompliance(): Observable<InfoCompliantModel> {
    return this.http
      .get<InfoCompliantModel>('/dnc/api/v2/private/compliance')
      .pipe(tap((res: InfoCompliantModel) => (this.infoCompliant = res)));
  }

  addOrRemovePhone(phone: string, action: EnumActionCompliant): Observable<InfoCompliantModel> {
    const body = {
      action,
      callerIdExceptionRule: phone
    };
    return this.http
      .put<InfoCompliantModel>('/dnc/api/v2/private/compliance', body)
      .pipe(tap((res: InfoCompliantModel) => (this.infoCompliant = res)));
  }
}

export enum EnumActionCompliant {
  ADD = 'add',
  REMOVE = 'remove'
}

export class InfoCompliantModel {
  orgUuid: string;
  callerIdExceptionRule: string[];
}
