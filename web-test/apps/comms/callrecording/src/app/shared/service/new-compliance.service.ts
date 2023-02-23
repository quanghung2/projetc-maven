import { forwardRef, Inject, Injectable } from '@angular/core';
import * as _ from 'lodash';
import { environment } from '../../../environments/environment';
import { User } from '../model/user.model';
import { BackendService } from './backend.service';

const COMPLIANCE_PATH = '/private/v3/compliance';

declare const X: any;

@Injectable()
export class NewComplianceService {
  public allMembers: User[];
  private msEndpoint: string = environment.api.endpoint;
  page = 0;

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {
    this.allMembers = [];
  }

  sortMembers() {
    this.allMembers = _.sortBy(this.allMembers, (item: User) => {
      return item.displayName ? item.displayName.toLowerCase() : '';
    });
  }

  getEncryptSetting(): Promise<any> {
    return this.backendService.get(COMPLIANCE_PATH + '/encrypt');
  }

  saveEncryptSetting(encryptConfig: any): Promise<any> {
    return this.backendService.post(COMPLIANCE_PATH + '/encrypt', encryptConfig);
  }

  getAllOrganizationMembers() {
    return this.backendService
      .get(
        this.backendService.parseApiUrl(
          `auth/private/v1/organizations/${X.orgUuid}/members?page=${this.page}&size=1000&includeDisabledMembers=true`,
          false,
          this.msEndpoint
        )
      )
      .then((data: any) => {
        this.pushMembers(data);
        if (data.length == 1000) {
          this.page++;
          this.getAllOrganizationMembers();
        } else {
          this.sortMembers();
        }
      })
      .catch((err: any) => {
        console.error(err);
      });
  }

  getAclSetting(): Promise<any> {
    return this.backendService.get(COMPLIANCE_PATH + '/acl');
  }

  saveAclSetting(aclConfig: any): Promise<any> {
    return this.backendService.post(COMPLIANCE_PATH + '/acl', aclConfig);
  }

  pushMembers(data) {
    data.forEach(menber => {
      this.allMembers.push(menber);
    });
  }
}
