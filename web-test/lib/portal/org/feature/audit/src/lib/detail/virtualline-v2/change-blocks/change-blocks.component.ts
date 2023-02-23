import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BizPhoneData, Block, CallCenterData, Change, ChangeBlock } from '@b3networks/api/audit';
import { HashMap } from '@datorama/akita';
import { AuditModalComponent } from '../../../common/audit-modal/audit-modal.component';
import { BaseAuditComponent } from '../../../common/base-audit.component';

@Component({
  selector: 'poa-change-blocks',
  templateUrl: './change-blocks.component.html',
  styleUrls: ['./change-blocks.component.scss']
})
export class ChangeBlocksComponent extends BaseAuditComponent implements OnInit {
  columns = ['ipaddress', 'ipaddressValue', 'change', 'valueChange'];
  mapAction = {
    add: 'Add block',
    delete: 'Delete block',
    edit: 'Edit block'
  };

  @Input() raw: any;

  audit: ChangeBlock;

  map: HashMap<string> = {
    displayB3Number: 'internal number',
    displayCaller: 'caller number',
    EXTENSION: 'ext',
    EXTENSION_GROUP: 'ext group',
    CONFERENCE: 'conf room',
    create: 'Add block',
    edit: 'Edit block',
    delete: 'Delete block'
  };

  constructor(private dialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.generateData();
  }

  generateData() {
    this.audit = new ChangeBlock();
    if (this.raw.clientInfo) {
      this.audit.ipAddress = this.raw.clientInfo.ipAddress;
    }
    this.audit.officeHour = this.raw.auditData.officeHour;
    this.audit.bizPhoneData = new BizPhoneData();
    this.audit.bizPhoneData.extensions = this.raw.auditData.bizPhoneData.extensions;
    this.audit.bizPhoneData.extensionGroups = this.raw.auditData.bizPhoneData.extension_groups;
    this.audit.bizPhoneData.conferenceRooms = this.raw.auditData.bizPhoneData.conference_rooms;

    this.audit.callCenterData = new CallCenterData();
    this.audit.callCenterData.queues = this.raw.auditData.callCenterData.queues;

    this.audit.details = this.raw.auditData.details;
    this.audit.action = this.generateAction(this.audit.details.action);
    this.audit.blockType = this.audit.details.oldData
      ? this.audit.details.oldData.type
      : this.audit.details.newData.type;
    this.audit.blockName = this.audit.details.oldData
      ? this.audit.details.oldData.label
      : this.audit.details.newData.label;

    const oldData = this.audit.details.oldData ? this.audit.details.oldData : new Block();
    const newData = this.audit.details.newData ? this.audit.details.newData : new Block();
    if (oldData && newData) {
      if (this.isDifferent(oldData.label, newData.label)) {
        this.audit.fieldChanges.push(new Change({ name: 'Label', oldValue: oldData.label, newValue: newData.label }));
      }

      const oldTTS = this.formatTTS(oldData.tts.entries);
      const newTTS = this.formatTTS(newData.tts.entries);
      if (this.isDifferent(oldTTS, newTTS)) {
        this.audit.fieldChanges.push(new Change({ name: 'Message', oldValue: oldTTS, newValue: newTTS }));
      }

      const oldBranch = this.formatBranches(this.audit.blockType, oldData.nextBlocks);
      const newBranch = this.formatBranches(this.audit.blockType, newData.nextBlocks);
      if (this.isDifferent(oldBranch, newBranch)) {
        this.audit.fieldChanges.push(new Change({ name: 'Branch', oldValue: oldBranch, newValue: newBranch }));
      }

      /*** gather block ***/
      if (this.isDifferent(oldData.attempts, newData.attempts)) {
        this.audit.fieldChanges.push(
          new Change({ name: 'Play times', oldValue: oldData.attempts, newValue: newData.attempts })
        );
      }

      if (this.isDifferent(oldData.timeout, newData.timeout)) {
        this.audit.fieldChanges.push(
          new Change({ name: 'Caller input timeout', oldValue: oldData.timeout, newValue: newData.timeout })
        );
      }

      if (this.isDifferent(oldData.maxDigits, newData.maxDigits)) {
        this.audit.fieldChanges.push(
          new Change({ name: 'Max digits', oldValue: oldData.maxDigits, newValue: newData.maxDigits })
        );
      }

      /*** go block ***/
      const goBranch = this.compareNestedField(oldData.goBlock, newData.goBlock, 'Forward to', 'label');
      if (goBranch) {
        this.audit.fieldChanges.push(goBranch);
      }

      if (this.isDifferent(oldData.goTimes, newData.goTimes)) {
        this.audit.fieldChanges.push(
          new Change({ name: 'Forward times', oldValue: oldData.goTimes, newValue: newData.goTimes })
        );
      }

      /*** transfer block ***/
      const oldDest = this.formatTransferDest(this.audit, oldData.dest);
      const newDest = this.formatTransferDest(this.audit, newData.dest);
      if (this.isDifferent(oldDest, newDest)) {
        this.audit.fieldChanges.push(new Change({ name: 'Transfer to', oldValue: oldDest, newValue: newDest }));
      }

      const callerIdStrategyType = this.compareNestedField(
        oldData.callerIdStrategy,
        newData.callerIdStrategy,
        'Show caller id as',
        'type'
      );
      if (callerIdStrategyType) {
        this.audit.fieldChanges.push(callerIdStrategyType);
      }

      const prefixCallerId = this.compareNestedField(
        oldData.callerIdStrategy,
        newData.callerIdStrategy,
        'Prefix caller id',
        'prefixCallerId'
      );
      if (prefixCallerId) {
        this.audit.fieldChanges.push(prefixCallerId);
      }

      if (this.isDifferent(oldData.ringTime, newData.ringTime)) {
        this.audit.fieldChanges.push(
          new Change({ name: 'Transfer failed after', oldValue: oldData.ringTime, newValue: newData.ringTime })
        );
      }

      /*** notify block ***/
      if (this.isDifferent(oldData.emailType, newData.emailType)) {
        this.audit.fieldChanges.push(
          new Change({ name: 'Email type', oldValue: oldData.emailType, newValue: newData.emailType })
        );
      }

      const oldEmails = this.formatEmail(oldData.email);
      const newEmails = this.formatEmail(newData.email);
      if (this.isDifferent(oldEmails, newEmails)) {
        this.audit.fieldChanges.push(new Change({ name: 'Emails', oldValue: oldEmails, newValue: newEmails }));
      }

      if (this.isDifferent(oldData.smsType, newData.smsType)) {
        this.audit.fieldChanges.push(
          new Change({ name: 'Sms type', oldValue: oldData.smsType, newValue: newData.smsType })
        );
      }

      const customSmsAddress = this.compareNestedField(
        oldData.sms,
        newData.sms,
        'Custom sms address',
        'customSmsAddress'
      );
      if (customSmsAddress) {
        this.audit.fieldChanges.push(customSmsAddress);
      }

      const smsSender = this.compareNestedField(oldData.sms, newData.sms, 'Sender number', 'smsSender');
      if (smsSender) {
        this.audit.fieldChanges.push(smsSender);
      }

      const smsMessage = this.compareNestedField(oldData.sms, newData.sms, 'Sms message', 'smsMessage');
      if (smsMessage) {
        this.audit.fieldChanges.push(smsMessage);
      }

      if (this.isDifferent(oldData.enableVoiceMail, newData.enableVoiceMail)) {
        this.audit.fieldChanges.push(
          new Change({
            name: 'Enable voice mail',
            oldValue: oldData.enableVoiceMail,
            newValue: newData.enableVoiceMail
          })
        );
      }

      const webhookUrl = this.compareNestedField(oldData.webHookCommand, newData.webHookCommand, 'URL', 'url');
      if (webhookUrl) {
        this.audit.fieldChanges.push(webhookUrl);
      }

      const webhookMethod = this.compareNestedField(oldData.webHookCommand, newData.webHookCommand, 'Method', 'method');
      if (webhookMethod) {
        this.audit.fieldChanges.push(webhookMethod);
      }

      const oldHeaders = this.formatMap(!oldData.webHookCommand ? {} : oldData.webHookCommand.headers);
      const newHeaders = this.formatMap(!newData.webHookCommand ? {} : newData.webHookCommand.headers);
      if (this.isDifferent(oldHeaders, newHeaders)) {
        this.audit.fieldChanges.push(new Change({ name: 'Headers', oldValue: oldHeaders, newValue: newHeaders }));
      }

      const oldParams = this.formatMap(!oldData.webHookCommand ? {} : oldData.webHookCommand.parameters);
      const newParams = this.formatMap(!newData.webHookCommand ? {} : newData.webHookCommand.parameters);
      if (this.isDifferent(oldParams, newParams)) {
        this.audit.fieldChanges.push(new Change({ name: 'Parameters', oldValue: oldParams, newValue: newParams }));
      }
    }
  }

  private generateAction(action: string) {
    if (!action || !this.map[action]) {
      return '-';
    }

    return this.map[action];
  }

  formatTransferDest(audit: ChangeBlock, dest: any) {
    if (!dest) {
      return '';
    }

    if (dest.type == 'e164number') {
      return dest.numbers;
    }

    if (dest.type == 'callcenter') {
      for (const queue of audit.callCenterData.queues) {
        if (queue.uuid == dest.queueUuid) {
          return `Queue ${queue.label}`;
        }
      }
    }

    if (dest.type == 'bizphone') {
      if (dest.forwardByKeys) {
        return `${this.map[dest.extType]} Forward by keys`;
      }

      if (dest.extType == 'EXTENSION') {
        for (const ext of audit.bizPhoneData.extensions) {
          if (dest.ext == ext.extKey) {
            return `${this.map[dest.extType]} ${ext.extKey} (${ext.extLabel})`;
          }
        }
      }

      if (dest.extType == 'EXTENSION_GROUP') {
        for (const ext of audit.bizPhoneData.extensionGroups) {
          if (dest.ext == ext.extGroupKey) {
            return `${this.map[dest.extType]} ${ext.name}`;
          }
        }
      }

      if (dest.extType == 'CONFERENCE') {
        return `${this.map[dest.extType]} ${dest.ext}`;
      }
    }

    return '';
  }

  formatTTS(entries: any[]) {
    if (!entries || entries.length == 0) {
      return '';
    }

    let result = '';
    for (const entry of entries) {
      if (entry.type == 'mp3') {
        result += `<${entry.s3Key}>`;
      } else if (entry.type == 'speech') {
        if (!entry.message) {
          entry.message = '';
        }
        result += `<speech language="${entry.language}" gender="${entry.gender}" pitch="${entry.pitch}" rate="${entry.rate}" voice-code="${entry.voiceCode}" vendor="${entry.vendor}">${entry.message}</speech>`;
      }
    }

    return result;
  }

  formatBranches(blockType: string, branches: any[]) {
    if (blockType == 'gather') {
      return this.formatGatherBranches(branches);
    } else if (blockType == 'condition') {
      return this.formatConditionBranch(branches);
    } else if (blockType == 'webhook') {
      return this.formatWebhookBranches(branches);
    } else {
      return '';
    }
  }

  formatGatherBranches(branches: any[]) {
    if (!branches || branches.length == 0) {
      return '[]';
    }

    let result = '';
    for (const branch of branches) {
      if (branch.type == 'any') {
        result += `[any digit ${branch.maxDigit}]`;
      } else if (branch.type == 'none') {
        result += `[no digit]`;
      } else if (branch.type == 'one') {
        result += `[digit ${branch.digit}]`;
      } else if (branch.type == 'multiple') {
        result += `[upload file ${branch.s3Key}]`;
      } else if (branch.type == 'regex') {
        result += `[regex ${branch.digit}]`;
      }
    }

    return result;
  }

  formatWebhookBranches(branches: any[]) {
    if (!branches || branches.length == 0) {
      return '[]';
    }

    let result = '';
    for (const branch of branches) {
      result += `[${branch.responseRegex}]`;
    }

    return result;
  }

  formatConditionBranch(branches: any) {
    if (!branches || branches.length == 0) {
      return '[]';
    }

    let result = '';
    for (const branch of branches) {
      if (branch.type == 'callerIdPattern') {
        result += `[caller start with ${branch.startWithList} and has length ${branch.lowerLength}-${branch.upperLength}]`;
      } else if (branch.type == 'callerIdInList') {
        result += `[upload file ${branch.s3Key}]`;
      } else if (branch.type == 'dateInRange' || branch.type == 'timeInRange') {
        result += `[between ${branch.from} and ${branch.to}]`;
      } else if (branch.type == 'expression') {
        result += `[expression ${branch.expressionTemplate}]`;
      } else if (branch.type == 'otherwise') {
        result += `[otherwise]`;
      }
    }

    return result;
  }

  formatMap(map: any) {
    if (!map || Object.keys(map).length == 0) {
      return '[]';
    }

    const keys = Object.keys(map);

    let result = '';
    for (const key of keys) {
      result += `[${key}: ${map[key]}]`;
    }

    return result;
  }

  formatEmail(email: any) {
    if (!email || !email.emailAddresses || email.emailAddresses.length == 0) {
      return '';
    }

    let result = '';
    for (const emailAddress of email.emailAddresses) {
      result += `${emailAddress},`;
    }

    return result;
  }

  compareNestedField(value1: any, value2: any, fieldName: string, key): Change {
    try {
      value1 = !value1 ? {} : value1;
      value2 = !value2 ? {} : value2;

      return this.isDifferent(value1[key], value2[key])
        ? new Change({
            name: fieldName,
            oldValue: this.getRealValue(value1[key]),
            newValue: this.getRealValue(value2[key])
          })
        : undefined;
    } catch (err) {
      console.error('error');
      console.error(value1);
      console.error(value2);
      return undefined;
    }
  }

  getRealValue(label: string) {
    if (Object.keys(this.map).includes(label)) {
      return this.map[label];
    }

    return label;
  }

  showModelDetail() {
    const data = {
      details: this.audit.fieldChanges,
      action: this.audit.action,
      mapAction: this.mapAction
    };
    this.dialog.open(AuditModalComponent, {
      width: '750px',
      data
    });
  }
}
