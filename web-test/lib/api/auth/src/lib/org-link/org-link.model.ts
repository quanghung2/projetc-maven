export class OrgLinkMember {
  acceptedAt: number;
  createdAt: number;
  leftAt: number;
  rejectedAt: number;
  logoUrl: string;
  name: string;
  role: string;
  shortName: string;
  uuid: string;

  constructor(obj?: Partial<OrgLinkMember>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class OrgLink {
  name: string;
  organizations: OrgLinkMember[];
  uuid: string;
  status?: 'Accepted' | 'Pending';
  isDefaultMemberAccepted: boolean;
  createdAt: number;

  constructor(obj?: Partial<OrgLink>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
