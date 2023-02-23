import { Status, WeekDay } from '@b3networks/api/workspace';
import { AttachmentMessageData } from './../chat/chat-message-attachment.model';
import { ConversationGroup } from './../conversation-group/model/conversation-group.model';
import { User } from './../user/user.model';
export interface EmailInbox {
  uuid?: string;
  name?: string;
  colorMark?: string;
  incommingEmail?: string;
  forwardEmail?: string;
}

export interface CreateEmailInboxRequest {
  name: string;
  email: string;
}

export class SendEmailInboxRequest {
  convoUuid: string;
  emailMessage: EmailMessageGeneral;
  isCreate?: boolean;
}

export interface EmailDraft extends SendEmailInboxRequest {
  id?: number;
  s3Key: string;
  s3Url?: string;
  createdBy: string;
  updatedAt: Date;
}

export interface EmailSchedule extends SendEmailInboxRequest {
  id: number;
  convoId: string;
  s3Key: string;
  s3Url: string;
  createdBy: string;
  updatedAt: Date;
  scheduledAt: Date;
  cancelReason: string;
  data?: EmailMessageGeneral;
  ts?: number;
}

export interface EmailSignature {
  id: number;
  name?: string;
  senderInfo?: string;
  content?: string;
  isDefault?: 'false' | 'true';
}

export class EmailTag {
  id = 0;
  name: string;
  colorMark = '#5151E1';
}

export interface EmailConversationTag {
  conversationGroupId: string;
  tagId: number;
}

export interface AgentInbox {
  identityUuid: string;
  inboxUuid: string;
}

export interface EmailAddress {
  name: string;
  address: string;
}

export interface EmailUploadRequest {
  convoUuid: string;
  s3Key: string;
  scheduleAt?: number;
}

export class EmailMessageGeneral {
  fromAddresses: EmailAddress[] = [];
  toAddresses: EmailAddress[] = [];
  ccAddresses: EmailAddress[] = [];
  bccAddresses: EmailAddress[] = [];
  replyToAddresses: EmailAddress[] = [];
  text: string;
  htmlText: string; // html message
  htmlQuoted: string; // html message: forward + reply : old workspace
  charset: string; // UTF-8
  inReplyTo: string[]; // UTF-8
  subject: string;
  previousEmailHtml: string;
  actionType: 'reply' | 'forward';
  attachments: AttachmentMessageData[];

  get hasFromAddresses() {
    return this.fromAddresses && this.fromAddresses.length;
  }

  get hasToAddresses() {
    return this.toAddresses && this.toAddresses.length;
  }

  get hasCCAddresses() {
    return this.ccAddresses && this.ccAddresses.length;
  }

  get hasBCCAddresses() {
    return this.bccAddresses && this.bccAddresses.length;
  }

  get hasAttachments() {
    return this.attachments && this.attachments.length;
  }

  constructor(obj?: Partial<EmailMessageGeneral>) {
    if (obj) {
      Object.assign(this, obj);
      if (!this.htmlText) {
        this.htmlText = obj.text.replace(/\n/g, '<br/>');
      }
      this.attachments = this.attachments?.map(x => new AttachmentMessageData(x)) || [];
    }
  }
}

export interface EmailSearchCriteria {
  id: number;
  keyword: string;
  conversations: ConversationGroup[];
  users: User[];
  fromDate: Date;
  toDate: Date;
}

export class EmailSearchCriteriaRequestV2 {
  constructor(
    public searchText: string,
    public status: string,
    public archivedBy: string,
    public snoozeBy: string,
    public snoozeFrom: number,
    public snoozeTo: number,
    public inboxUuid: string
  ) {}
}

export interface AgentNotification {
  identityUuid?: string;
  incommingEmailNotification?: Status;
}

export class EmailRule {
  id = 0;
  name: string;
  status: string;
  cannedResponseId: number;
  inboxUuids: string[] = [];
  workingDays: WorkingDay[] = [];
}

export interface WorkingTime {
  from: string;
  to: string;
}

export class WorkingDay {
  isWorkingDay = false;
  day: WeekDay;
  timeRanges: WorkingTime[] = [];
}
