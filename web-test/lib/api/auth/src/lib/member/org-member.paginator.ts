import { inject, InjectionToken } from '@angular/core';
import { PaginatorPlugin } from '@datorama/akita';
import { OrgMemberQuery } from './org-member.query';

export const ORG_MEMBER_PAGINATOR = new InjectionToken('ORG_MEMBER_PAGINATOR', {
  providedIn: 'root',
  factory: () => {
    const query = inject(OrgMemberQuery);
    return new PaginatorPlugin(query).withControls().withRange();
  }
});
