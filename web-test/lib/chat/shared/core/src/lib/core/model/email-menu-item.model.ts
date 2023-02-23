import { User } from '@b3networks/api/workspace';

export interface EmailMenuItem {
  displayText: string;
  icon: string;
  routerLink: string[];
  count?: number;
  agent?: User;
}
