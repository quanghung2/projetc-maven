import { BaseModel } from './base.model';

export enum AgentRole {
  MEMBER = <any>'MEMBER',
  AGENT = <any>'AGENT',
  MANAGER = <any>'MANAGER',
  ADMIN = <any>'ADMIN'
}

export class Agent extends BaseModel {
  public uuid: string = null;
  public role: AgentRole = null;
  public givenName: string = null;
  public familyName: string = null;
  public countryCode: string = null;
  public callerId: string = null;
  public phoneNumber: string = null;
  public email: string = null;
  public timezone: string = null;
  public managerUuid: string = null;

  public displayName: string = null;

  // local
  public checked: boolean = true;

  static fromList(sources: Array<Agent>) {
    return sources.map(s => new Agent().update(s));
  }

  static filterRole(agents: Array<Agent>, role: AgentRole) {
    if (agents == undefined) {
      return [];
    }

    let res = [];
    agents.forEach((user: Agent) => {
      if (user.role == role) {
        res.push(user);
      }
    });

    return res;
  }
}
