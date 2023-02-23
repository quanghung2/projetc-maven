import { Component, Input, OnInit } from '@angular/core';
import { AuditData, Change } from '@b3networks/api/audit';

@Component({
  selector: 'poa-edit-callcenter-agent-state',
  templateUrl: './edit-callcenter-agent-state.component.html',
  styleUrls: ['./edit-callcenter-agent-state.component.scss']
})
export class EditCallcenterAgentStateComponent implements OnInit {
  columns = ['change', 'valueChange'];
  comparedFields: any = [
    {
      path: ['status'],
      label: 'Status'
    }
  ];
  audit: AuditData;

  @Input('raw') raw: any;

  constructor() {}

  ngOnInit(): void {
    this.generateAuditData();
  }

  generateAuditData() {
    this.audit = new AuditData();

    let oldState = this.raw.auditData.oldState;
    let newState = this.raw.auditData.newState;

    this.comparedFields.forEach(field => {
      this.isDifferent(oldState, newState, field);
    });
  }

  isDifferent(oldConfig: any, newConfig: any, field) {
    let oldValue = oldConfig;
    let newValue = newConfig;
    for (let i = 0; i < field.path.length; i++) {
      if (oldValue) {
        if (oldValue instanceof Array) {
          oldValue = oldValue
            .map(e => {
              let n = e;
              field.path[i].forEach(p => {
                n = n[p];
              });
              return n;
            })
            .join('; ');
        } else {
          oldValue = oldValue[field.path[i]];
        }
      }
      if (newValue) {
        if (newValue instanceof Array) {
          newValue = newValue
            .map(e => {
              let n = e;
              field.path[i].forEach(p => {
                n = n[p];
              });
              return n;
            })
            .join('; ');
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
}
