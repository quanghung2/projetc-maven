import { Identity } from '../identity/identity';
import { PolicyDocument } from '../organization-policy/policty-document.model';

export interface TeamMember {
  identity: Identity;
  createdDateTime: number;
}

export interface Team {
  uuid?: string;
  name: string;
  active: boolean;
  policyDocument: PolicyDocument;

  admins: string[];
  members: TeamMember[];
}
