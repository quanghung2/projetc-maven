import { startOfDay } from 'date-fns';
import differenceInDays from 'date-fns/differenceInDays';
import { CaseActivity } from './case-activity';

export interface CaseIdentity {
  id: number;
  sid: number;
  ownerOrgUuid: string; //return in detail api but not querying
}

export enum CaseStatus {
  open = 'open',
  closed = 'closed',
  deleted = 'deleted',
  draft = 'draft'
}

export interface RelatedCase {
  sid: number;
  orgUuid: string;
  title: string;
}

export class Case implements CaseIdentity {
  id: number;
  sid: number;

  ownerOrgUuid: string;
  ownerOrgPhoto: string;
  ownerOrgName: string;

  title: string;

  productIds?: number[];
  severityId: number;
  typeId: number;

  assignees: string[];

  status: CaseStatus;

  dueAt: number;
  createdAt: number;
  updatedAt: number;

  constructor(obj?: Partial<Case>) {
    if (obj) {
      Object.assign(this, obj);
      if (obj['orgUuid'] && !this.ownerOrgUuid) {
        this.ownerOrgUuid = obj['orgUuid']; // fallback for querying api
        this.ownerOrgName = obj['orgName'];
        this.ownerOrgPhoto = obj['orgPhoto'];
      }
      this.assignees = this.assignees || [];
    }
  }

  get isReachedDueDate() {
    return differenceInDays(startOfDay(new Date()), startOfDay(new Date(this.dueAt))) > 0;
  }
}

export class CaseDetail extends Case {
  accessControlId: string;
  description: string;

  srcDomain?: string;
  srcOrgUuid?: string;

  createdByIdentity: string;
  createdByIdentityName: string;
  createdByOrg: string;

  relatedCases: RelatedCase[];
  activities: CaseActivity[];
  watchers: string[];

  //@deprecated
  collaborators: Collaborator[];

  constructor(obj?: Partial<CaseDetail>) {
    super(obj);
  }
}

export interface QueryCaseReq {
  sid?: number;

  textSearch?: string;
  status?: CaseStatus;

  srcDomain?: string;
  srcOrgUuid?: string;

  productId?: number;
  typeId?: number;

  fields?: string[];
  orderByField?: string;

  collaboratorRoles?: CollaboratorRole[];
  assignee?: string;
}

export class QueryCaseResp {
  countOpen: number;
  countClosed: number;
  countAll: number;
  items: Case[];

  constructor(obj?: Partial<QueryCaseResp>) {
    if (obj) {
      Object.assign(this, obj);
      this.items = (obj.items || []).map(i => new Case(i));
    }
  }
}

export interface StoreCaseReq {
  title?: string;
  description?: string;
  rawDescription?: string;
  srcDomain?: string;
  srcOrgUuid?: string;

  severityId?: number;
  productIds?: number[];
  typeId?: number;
  dueDate?: number;

  assignees?: string[];
  mentionIds?: string[];
  relatedTos?: number[];
  ownerUuid?: string;

  status?: CaseStatus;
}

export interface UpdateCaseReq {
  title?: string;
  description?: string;
  rawDescription?: string;
  srcDomain?: string;
  srcOrgUuid?: string;
  dueDate?: number;
  status?: CaseStatus;
  severityId?: number;
  typeId?: number;
  addProductIds?: number[];
  removeProductIds?: number[];
  mentionIds?: string[];
}

export interface Attachment {
  key?: string;
  fileType?: string;
  fileName: string;
  size: number;
}

export interface AssigneesCase {
  identityUuid: string;
  orgUuid: string;
}

export interface SeverityCase {
  id: number;
  name: string;
  colorHex: string;
}

export interface typeCase {
  id: number;
  name: string;
}

export interface NotificationsCase {
  count: number;
  lastUpdated: number;
  notifications: Notification[];
  events: Notification[];
  unread: number;
}

export interface Notification {
  id: number;
  clicked: boolean;
  caseId: number;
  isRead: boolean;
  responseId: number;
  type: string;
  caseSid: number;
  caseTitle: string;
  triggeredByPhotoUrl: string;
  triggeredByName: string;
  updatedAt: number;
  updatedBy: string;
}

export interface Collaborator {
  orgUuid: string;
  role: CollaboratorRole;
}

export enum CollaboratorRole {
  creator = 'creator',
  owner = 'owner',
  participant = 'participant'
}

export enum NotificationContent {
  caseClose = 'closed on a case',
  assigned = 'assigned a case to you',
  unassign = 'unassigned on a case',
  newCommentPosted = 'commented on a case',
  caseReopen = 'reopen on a case',
  mentionInCase = 'mentioned to you on a case',
  mentionInComment = 'mentioned to you on a case'
}

export const AllowedExtension = [
  'avi',
  'bmp',
  'cfg',
  'csv',
  'doc',
  'docx',
  'gif',
  'jpg',
  'jpeg',
  'json',
  'mkv',
  'mov',
  'mp3',
  'mp4',
  'pdf',
  'png',
  'psd',
  'rar',
  'tif',
  'tiff',
  'svg',
  'txt',
  'wav',
  'webm',
  'wmv',
  'xls',
  'xlsx',
  'xml',
  'zip',
  '7z',
  'pcap'
];
