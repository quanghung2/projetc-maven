export interface MemberOfProject {
  memberName: string;
  memberUuid: string;
}

export interface Project {
  assignedMembers: MemberOfProject[];
  capabilities: string[];
  lastUpdatedAt: number;
  name: string;
  subscriptionUuid: string;
  uuid: string;
}

export interface CreateProjectReq {
  name: string;
  capabilities: string[];
  subUuid: string;
}
