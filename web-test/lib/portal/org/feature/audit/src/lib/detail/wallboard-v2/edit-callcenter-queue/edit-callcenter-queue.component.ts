import { Component, Input, OnInit } from '@angular/core';
import { AuditData, Change } from '@b3networks/api/audit';

@Component({
  selector: 'poa-edit-callcenter-queue',
  templateUrl: './edit-callcenter-queue.component.html',
  styleUrls: ['./edit-callcenter-queue.component.scss']
})
export class EditCallcenterQueueComponent implements OnInit {
  @Input('raw') raw: any;

  mapAction: any = {
    ADD: 'Add queue',
    DELET: 'Delete queue',
    EDIT: 'Edit queue'
  };

  audit: AuditData;

  comparedFields: any = [
    {
      path: ['label'],
      label: 'Label'
    },
    {
      path: ['priority'],
      label: 'Priority'
    },
    {
      path: ['code'],
      label: 'Code'
    },
    {
      path: ['slaThreshold'],
      label: 'SLA threshold'
    },
    {
      path: ['assignedAgents', ['agentId', 'label']],
      attach: ['proficiency'],
      label: 'Assigned agents'
    },
    {
      path: ['agentWorkflowConfig', 'codeOptions'],
      label: 'Code options'
    },
    {
      path: ['agentWorkflowConfig', 'script'],
      label: 'Answer script'
    },
    {
      path: ['callflowConfig', 'musicOnHold'],
      label: 'Music on hold',
      split2ListWithRegex: /(<url[^>]+>[^<]*<\/url>)|(<speech[^>]+>[^<]*<\/speech>)/gm,
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'ringMode'],
      label: 'Ring mode'
    },
    {
      path: ['callflowConfig', 'ringTime'],
      label: 'Ring time'
    },
    {
      path: ['callflowConfig', 'waitTime'],
      label: 'Waiting time'
    },
    {
      path: ['callflowConfig', 'gatherMsg'],
      label: 'Gather message',
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'gatherTimeout'],
      label: 'Gather timeout'
    },
    {
      path: ['callflowConfig', 'maxGatherTimes'],
      label: 'Max gather times'
    },
    {
      path: ['callflowConfig', 'hangupMsgOnMaxGatherTimes'],
      label: 'Hangup msg on max gather',
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'digitsTriggerVoiceMail'],
      label: 'Digits trigger voicemail'
    },
    {
      path: ['callflowConfig', 'digitsTriggerCallback'],
      label: 'Digit leave callback'
    },
    {
      path: ['callflowConfig', 'maxQueueSizeThreshold', 'threshold'],
      label: 'Max queue size'
    },
    {
      path: ['callflowConfig', 'maxWaitingTimeThreshold', 'threshold'],
      label: 'Max waiting time'
    },
    {
      path: ['callflowConfig', 'voicemailConfig', 'message'],
      label: 'Voicemail message',
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['postCallConfig', 'message'],
      label: 'Call-survey message'
    },
    {
      path: ['postCallConfig', 'senderNumber'],
      label: 'Call-survey caller id'
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'callerId'],
      label: 'Callback caller id'
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'askCallerContactMessage'],
      label: "Ask caller's contact message",
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'validContactPattern'],
      label: 'Valid contact pattern'
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'invalidContactMessage'],
      label: 'Invalid contact message',
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'confirmCallerContactMessage'],
      label: "Confirm caller's contact message",
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'byeMessage'],
      label: 'Goodbye message',
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'reachLimitRetryInputContactMessage'],
      label: 'Reach limit retry input contact message',
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'announcementMessage2agent'],
      label: 'Announcement message to agent',
      removeRegex: [/<url[^>]+>/gm, /<\/url>/gm, /<speech[^>]+>/gm, /<\/speech>/gm, /.*\//gm, /\?[Expires].*/gm]
    },
    {
      path: ['callflowConfig', 'callbackConfig', 'retryConfirmCallerContactTimes'],
      label: 'Max asking caller contact retry times'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.audit = new AuditData();

    if (this.raw.clientInfo) {
      this.audit.ipAddress = this.raw.clientInfo.ipAddress;
    }
    this.audit.action = this.generateAuditAction(this.raw.auditData.action);

    let oldConfig = this.raw.auditData.oldQueueConfig;
    let newConfig = this.raw.auditData.newQueueConfig;

    this.comparedFields.forEach(field => {
      this.isDifferent(oldConfig, newConfig, field);
    });
  }

  private generateAuditAction(action: string) {
    if (!action || !this.mapAction[action]) {
      return '-';
    }

    return this.mapAction[action];
  }

  isDifferent(oldConfig: any, newConfig: any, field) {
    let oldValue = this.applyPathToGetValue(oldConfig, field);
    let newValue = this.applyPathToGetValue(newConfig, field);

    let formattedOldValue = this.removeRawInfo(oldValue, field);
    let formattedNewValue = this.removeRawInfo(newValue, field);

    if (formattedOldValue != formattedNewValue) {
      this.audit.details.changeList.push(
        this.formatChange(new Change({ name: field.label, oldValue: formattedOldValue, newValue: formattedNewValue }))
      );
    }
  }

  private applyPathToGetValue(value: any, field: any) {
    if (!value) {
      return undefined;
    }

    for (let i = 0; i < field.path.length; i++) {
      if (value instanceof Array) {
        value = value.map(e => {
          let n = e;
          let attachItem;
          if (field.attach) {
            attachItem = Object.assign({}, n);
            field.attach.forEach(p => {
              attachItem = attachItem[p];
            });
          }

          field.path[i].forEach(p => {
            n = n[p];
          });

          if (attachItem) {
            n += ` (${attachItem})`;
          }

          return n;
        });
      } else {
        if (value) {
          value = value[field.path[i]];
        }
      }
    }

    if (field.split2ListWithRegex) {
      value = value.toString().split(field.split2ListWithRegex);
      value = value.filter(v => v !== undefined && v !== '');
    }

    return value;
  }

  private removeRawInfo(value: any, field: any) {
    if (value instanceof Array) {
      if (field.removeRegex) {
        value = value.map(v => {
          field.removeRegex.forEach(regex => {
            try {
              v = v.replace(regex, '');
            } catch (e) {}
          });

          return v;
        });
      }

      value = value.sort().join('; ');
    } else {
      if (field.removeRegex) {
        field.removeRegex.forEach(regex => {
          try {
            value = value.replace(regex, '');
          } catch (e) {}
        });
      }
    }

    return value === undefined || value === null ? '' : value.toString();
  }

  private formatChange(change: Change) {
    if (!change.oldValue.toString().includes(';') && !change.newValue.toString().includes(';')) {
      return change;
    }

    let addedItems = [];
    let removedItems = [];

    let olds = change.oldValue ? this.trim(change.oldValue.split(';')) : [];
    let news = change.newValue ? this.trim(change.newValue.split(';')) : [];
    olds.forEach(o => {
      if (news.indexOf(o) === -1) {
        removedItems.push(o);
      }
    });
    news.forEach(n => {
      if (olds.indexOf(n) === -1) {
        addedItems.push(n);
      }
    });

    let result = '';
    if (addedItems.length > 0) {
      result += '- add ' + addedItems.join('; ') + '<br>';
    }
    if (removedItems.length > 0) {
      result += '- remove ' + removedItems.join('; ');
    }

    return new Change({
      name: change.name,
      oldValue: change.oldValue,
      newValue: change.newValue,
      formattedValue: result
    });
  }

  private trim(list: string[]): string[] {
    return list.map(item => {
      return item.trim();
    });
  }
}
