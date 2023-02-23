import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuditData, Change } from '@b3networks/api/audit';
import { AuditModalComponent } from '../../common/audit-modal/audit-modal.component';

@Component({
  selector: 'poa-detail-wallboard-v1',
  templateUrl: './detail-wallboard-v1.component.html',
  styleUrls: ['./detail-wallboard-v1.component.scss']
})
export class DetailWallboardV1Component implements OnInit {
  @Input('raw') rawData: any;

  columns = ['change', 'valueChange'];
  audit: AuditData;
  comparedFields: any = [
    {
      path: ['label'],
      label: 'Queue name'
    },
    {
      path: ['priority'],
      label: 'Priority'
    },
    {
      path: ['generalConfig', 'codeOptions'],
      label: 'Code options'
    },
    {
      path: ['generalConfig', 'script'],
      label: 'Answer script'
    },
    {
      path: ['generalConfig', 'disableNotes'],
      label: 'Disable notes'
    },
    {
      path: ['inqueueConfig', 'musicOnHold'],
      label: 'Music on hold'
    },
    {
      path: ['inqueueConfig', 'waitTime'],
      label: 'Waiting time'
    },
    {
      path: ['inqueueConfig', 'waitConfirmMessage'],
      label: 'Gather message'
    },
    {
      path: ['inqueueConfig', 'gatherTimeout'],
      label: 'Gather timeout'
    },
    {
      path: ['inqueueConfig', 'digitsTriggerVoiceMail'],
      label: 'Digits trigger voicemail'
    },
    {
      path: ['inqueueConfig', 'hangupMsgOnMaxGather'],
      label: 'Hangup msg on max gather'
    },
    {
      path: ['maxQueueCountConfig', 'maxQueueCount'],
      label: 'Max queue count'
    },
    {
      path: ['maxQueueCountConfig', 'msgOnMaxQueueCount'],
      label: 'Msg on max queue count'
    },
    {
      path: ['maxWaitingTimeConfig', 'maxWaitingTime'],
      label: 'Max waiting time'
    },
    {
      path: ['maxWaitingTimeConfig', 'msgOnMaxWaitingTime'],
      label: 'Msg on max waiting time'
    },
    {
      path: ['callbackConfig', 'digitsLeaveCallbackContact'],
      label: 'Digit leave callback contact'
    },
    {
      path: ['callbackConfig', 'askCallerContactMessage'],
      label: 'Ask caller contact message'
    },
    {
      path: ['callbackConfig', 'confirmCallerContactMessage'],
      label: 'Confirm caller contact message'
    },
    {
      path: ['callbackConfig', 'byeMessage'],
      label: 'Bye message'
    },
    {
      path: ['extensions', ['key', 'label', 'proficiency']],
      label: 'Assigned agents'
    }
  ];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.generateAuditData();
  }

  generateAuditData() {
    this.audit = new AuditData();
    this.audit.action = this.rawData.action;
    let rawAuditData = this.rawData.auditData;
    let oldConfig = rawAuditData.oldQueueConfig;
    let newConfig = rawAuditData.newQueueConfig;
    this.comparedFields.forEach(field => {
      this.isDifferent(oldConfig, newConfig, field);
    });
    console.log(this.audit.details.changeList);
  }

  isDifferent(oldConfig: any, newConfig: any, field) {
    let oldValue = oldConfig;
    let newValue = newConfig;
    for (let i = 0; i < field.path.length; i++) {
      if (oldValue) {
        if (oldValue instanceof Array) {
          oldValue = oldValue.map(e => field.path[i].map(p => e[p]).join('-')).join(' ;');
        } else {
          oldValue = oldValue[field.path[i]];
        }
      }
      if (newValue) {
        if (newValue instanceof Array) {
          newValue = newValue.map(e => field.path[i].map(p => e[p]).join('-')).join(' ;');
        } else {
          newValue = newValue[field.path[i]];
        }
      }
    }

    if (oldValue instanceof Array) {
      oldValue = oldValue.join(' ;');
    }
    if (newValue instanceof Array) {
      newValue = newValue.join(' ;');
    }

    let formatted1 = oldValue == undefined || oldValue == null ? '' : oldValue;
    let formatted2 = newValue == undefined || newValue == null ? '' : newValue;
    if (formatted1 != formatted2) {
      this.audit.details.changeList.push(new Change({ name: field.label, oldValue: formatted1, newValue: formatted2 }));
    }
  }

  showModelDetail() {
    const data = {
      details: this.audit.details.changeList,
      action: this.audit.action,
      mapAction: {
        add: 'Add queue',
        delete: 'Delete queue',
        edit: 'Edit queue'
      }
    };
    this.dialog.open(AuditModalComponent, {
      width: '750px',
      data
    });
  }
}
