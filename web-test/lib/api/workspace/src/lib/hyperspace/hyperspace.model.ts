import { User } from './../user/user.model';

export class Hyperspace {
  // not use, mapping to use
  private srcOrg: InfoOrg;
  private destOrg: InfoOrg;
  private namespaces: Namespace[]; // can be null

  id: string;
  name: string;
  hyperspaceId: string;
  createdAt: number;
  createdBy: string; // identityUuid
  acceptedBy: string; // orgUuid
  acceptedAt: number;

  // mapping to increase performance
  fromSource: boolean; // current org is source or destination
  currentOrg: InfoOrg;
  otherOrg: InfoOrg;

  constructor(obj: Partial<Hyperspace>) {
    if (obj) {
      Object.assign(this, obj);
      this.namespaces = this.namespaces?.map(x => new Namespace(x)) || [];
    }
  }

  withCurrentOrg(orgUuid: string) {
    this.currentOrg = this.srcOrg?.uuid === orgUuid ? this.srcOrg : this.destOrg;
    this.currentOrg.users = (this.namespaces?.find(x => x.id === this.currentOrg.uuid)?.users || []).map(
      u =>
        new UserHyperspace({
          ...u,
          uuid: u['identityUuid'],
          userUuid: u['chatUserId'],
          // hypersapce info
          orgUuid: this.currentOrg.uuid,
          name: this.currentOrg.name,
          shortName: this.currentOrg.shortName,
          logoUrl: this.currentOrg.logoUrl,
          domain: this.currentOrg.domain,
          isCurrentOrg: true
        })
    );
    this.fromSource = this.srcOrg?.uuid === orgUuid;

    this.otherOrg = this.srcOrg?.uuid === orgUuid ? this.destOrg : this.srcOrg;
    this.otherOrg.users = (this.namespaces?.find(x => x.id === this.otherOrg.uuid)?.users || []).map(
      u =>
        new UserHyperspace({
          ...u,
          uuid: u['identityUuid'],
          userUuid: u['chatUserId'],
          // hypersapce info
          orgUuid: this.otherOrg.uuid,
          name: this.otherOrg.name,
          shortName: this.otherOrg.shortName,
          logoUrl: this.otherOrg.logoUrl,
          domain: this.otherOrg.domain,
          isCurrentOrg: false
        })
    );

    // not use ,remove to avoid new instance
    delete this.srcOrg;
    delete this.destOrg;
    delete this.namespaces;
    return this;
  }

  get nameOtherOrg() {
    return this.otherOrg?.name;
  }

  get allMembers() {
    return [...this.currentOrg.users, ...this.otherOrg.users] || [];
  }

  get status(): StatusHyperspace {
    return this.acceptedAt
      ? StatusHyperspace.active
      : this.fromSource
      ? StatusHyperspace.waiting
      : StatusHyperspace.pending;
  }
}

export class Namespace {
  id: string; // orgUuid
  users: User[];

  constructor(obj: Partial<Namespace>) {
    if (obj) {
      Object.assign(this, obj);
      this.users = obj.users?.map(x => new User(x));
    }
  }
}

export class UserHyperspace extends User {
  shortName: string;
  logoUrl: string;
  domain: string;
  isCurrentOrg: boolean;

  constructor(obj?: Partial<UserHyperspace>) {
    super();
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface InfoOrg {
  uuid: string;
  name: string;
  shortName: string;
  logoUrl: string;
  domain: string;
  users: UserHyperspace[];
}

export enum StatusHyperspace {
  all = 'all', // ui
  pending = 'pending',
  waiting = 'waiting',
  active = 'active'
}

export interface ReqHyperspaceManagement {
  add: string[]; // chatUserid
  remove: string[];
}

export interface ReqHyperspaceCreate {
  name: string;
  description: string;
}
