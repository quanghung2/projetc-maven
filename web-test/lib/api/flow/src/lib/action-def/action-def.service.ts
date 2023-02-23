import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ActionDef, GetBusinessActionDefReq } from './action-def.model';

@Injectable({
  providedIn: 'root'
})
export class ActionDefService {
  constructor(private http: HttpClient) {}

  private appName(isSimpleApp: boolean) {
    return isSimpleApp ? 'simpleApp' : 'app';
  }

  getActionDef(uuid: string, isSimpleApp: boolean = false): Observable<ActionDef> {
    return this.http.get<ActionDef>(`flow/private/${this.appName(isSimpleApp)}/v1/actionDefs/${uuid}`);
  }

  getBusinessActionDefs(req: GetBusinessActionDefReq): Observable<ActionDef[]> {
    let params = new HttpParams()
      .set('triggerDefUuid', req.triggerDefUuid)
      .set('excludeInUse', String(req.excludeInUse))
      .set('releaseGroupId', req.releaseGroupId);

    if (req.additionalKey) {
      params = params.set('additionalKey', req.additionalKey);
    }

    return this.http.get<ActionDef[]>(`flow/private/app/v1/businessActionDefs`, { params }).pipe(
      tap(list => {
        list.forEach(item => {
          item.hasParameter = item.parameters.filter(p => !p.hidden).length > 0;
        });
      })
    );
  }
}
