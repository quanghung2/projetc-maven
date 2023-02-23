import { TimeRangeKey } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';

export class UnifiedSMSHistory {
  accessors: string[];
  destination: string;
  txnUuid: string;
  type: SmsType;
  orgUuid: string;
  queueTime?: number;
  dispatchTime?: number;
  deliveryTime?: number;
  senderName: string;
  multipart: number;
  time: number;
  id: string;
  key: string;
  status: SmsStatus;
  reason: string; // status === rejected
  deliveryAckTime: number | null;
  deliveryAcked: boolean;
  notifyEndpoint: string | null;

  constructor(obj?: Partial<UnifiedSMSHistory>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayTime(): number {
    switch (this.status) {
      case SmsStatus.queued:
      case SmsStatus.rejected:
        return this.queueTime;
      case SmsStatus.delivered:
      case SmsStatus.sent:
        return this.dispatchTime;
      case SmsStatus.deliveryFailed:
        return this.deliveryTime;
      default:
        return this.time;
    }
  }

  get displayStatus(): string {
    switch (this.status) {
      case SmsStatus.queued:
        return 'Queued';
      case SmsStatus.sent:
        return 'Sent';
      case SmsStatus.delivered:
        return 'Delivered';
      case SmsStatus.deliveryFailed:
        return 'Delivery Failed';
      case SmsStatus.rejected:
        return 'Rejected';
      case SmsStatus.deliveryExpired:
        return 'Delivery Expired';
      default:
        return '';
    }
  }
}

export const RejectReason: HashMap<string> = {
  rejected_msg_too_big: 'Message too long',
  rejected_dest_not_supported: 'Destination country is not supported',
  rejected_dest_same_as_sender: 'Destination number same as sender number',
  rejected_invalid_sender_name: 'Blocked Sender Name'
};

export enum SmsType {
  all = 'all',
  incoming = 'incoming',
  outgoing = 'outgoing'
}

export enum SmsStatus {
  all = 'all',
  queued = 'queued',
  sent = 'dispatched',
  delivered = 'delivered',
  deliveryFailed = 'deliveryFailed',
  rejected = 'rejected',
  deliveryExpired = 'deliveryExpired'
}

export interface SmsHistoryFilter {
  timeRange: TimeRangeKey;
  startDate: Date;
  endDate: Date;
  inputSearch: string;
  type: SmsType;
  status: SmsStatus;
  campaignUuid?: string;
}
