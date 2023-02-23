import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
import { User } from '../model';

@Pipe({
  name: 'orgMember'
})
export class OrgMemberPipe implements PipeTransform {
  transform(identity: any, orgMembers: User[], fieldName: string): any {
    const result: User = _.find(orgMembers, (user: User) => {
      return user.uuid === identity || user.email === identity;
    });

    if (result) {
      return result[fieldName];
    } else {
      return '-';
    }
  }
}
