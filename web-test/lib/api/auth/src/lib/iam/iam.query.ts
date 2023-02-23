import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { IamState, IamStore } from './iam.store';
import { filter, map } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { MeIamQuery } from '../me-iam/me-iam.query';

export interface ActionMapping {
  [key: string]: boolean;
}

@Injectable({ providedIn: 'root' })
export class IamQuery extends Query<IamState> {
  groups$ = this.select('groups');
  member$ = this.select('member');
  actions$ = this.select('actions');

  constructor(protected override store: IamStore, private meIamQuery: MeIamQuery) {
    super(store);
  }

  selectActionMapping(iamGroupUuid: string): Observable<ActionMapping> {
    return combineLatest([this.member$, this.actions$, this.meIamQuery.selectGrantedGroup(iamGroupUuid)])
      .pipe(filter(([m]) => !!m))
      .pipe(
        map(([member, actions, granted]) => {
          // the administrator has all permissions or none
          return actions?.reduce((acc, item) => {
            const hasPermission =
              member?.isUpperAdmin && granted
                ? true
                : member?.isUpperAdmin && !granted
                ? false
                : member?.iamPolicy?.policies?.some(userPermission =>
                    userPermission.isAllowedAction(item.service, item.action)
                  );
            acc[item.action] = hasPermission;
            return acc;
          }, {});
        })
      );
  }
}
