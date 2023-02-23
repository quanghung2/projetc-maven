import { forwardRef, Inject, Injectable } from '@angular/core';
import { Agent } from '../model';
import { MsAuth } from '../repo/ms-auth.service';
import { environment } from './../../../environments/environment';
import { BackendService } from './backend.service';
import { UserService } from './user.service';

const COMPLIANCE_PATH = '/private/v2/compliance';

@Injectable()
export class ComplianceService {
  private msEndpoint: string = environment.api.endpoint;
  private crComplianceLicense: any;

  constructor(
    @Inject(forwardRef(() => MsAuth)) private msAuth: MsAuth,
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  getUsers(query?: any) {
    return this.backendService.get(COMPLIANCE_PATH + '/users', query).then((data: any) => {
      data.entries = Agent.fromList(data.entries);
      return data;
    });
  }

  setUser(agent: Agent) {
    return this.backendService.put(COMPLIANCE_PATH + `/users/${agent.uuid}`, agent);
  }

  addUser(agent: Agent) {
    return this.backendService.post(COMPLIANCE_PATH + '/users', agent);
  }

  deleteUser(agent: Agent) {
    return this.backendService.delete(COMPLIANCE_PATH + `/users/${agent.uuid}`);
  }

  getSettings(query?: any) {
    return this.backendService.get(COMPLIANCE_PATH + '/organization', query);
  }

  getAwsSettings(query?: any) {
    return this.backendService.get(COMPLIANCE_PATH + '/organization/aws', query);
  }

  setSettings(settings: any) {
    return this.backendService.put(COMPLIANCE_PATH + `/organization`, settings);
  }

  setAwsSettings(settings: any) {
    return this.backendService.put(COMPLIANCE_PATH + `/organization/aws`, settings);
  }

  setCryptoSettings(settings: any) {
    return this.backendService.put(COMPLIANCE_PATH + `/organization/crypto`, settings);
  }

  getCrComplianceLicense(): Promise<any> {
    if (this.crComplianceLicense != undefined) {
      return Promise.resolve(this.crComplianceLicense.plan);
    }
    return this.backendService.get('/private/v2/subscriptions/compliance/plan').then((license: any) => {
      this.crComplianceLicense = license;
      return license.plan;
    });
  }
}
