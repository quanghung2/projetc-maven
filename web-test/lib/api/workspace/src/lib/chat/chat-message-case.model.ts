import { MetadataTxnWidget } from '@b3networks/api/auth';
import { ChatTypeTxn, TxnType } from '@b3networks/api/callcenter';
import { ContactList, UserContactType } from '@b3networks/api/contact';
import { ActionCase } from '../enums.model';

export interface CaseMessageData {
  action: ActionCase;
  txnType: TxnType;
  txnUuid: string;
  customerUuid: string;
  customerName: string;
  members: string[]; // identityUuid
  txnUuids: string[]; // action txnTag2Case
  caseCode: string; // action txnTag2Case
  caseLabel: string; // action txnTag2Case
  caseStatus: string; // StatusCase
  chatCustomerId: string;
  startedAtByUnix: number;
  channel: ChatTypeTxn;
  metadata: MetadataTxnWidget;

  // txnTag2Case dont have contactList
  contactListType: ContactList[];
  customerType: UserContactType;
}
