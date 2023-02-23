import { Component, Input, OnInit } from '@angular/core';
import { AuditData, Change } from '@b3networks/api/audit';
import { HashMap } from '@datorama/akita';

@Component({
  selector: 'poa-edit-callcenter-setting',
  templateUrl: './edit-callcenter-setting.component.html',
  styleUrls: ['./edit-callcenter-setting.component.scss']
})
export class EditCallcenterSettingComponent implements OnInit {
  @Input('raw') raw: any;

  audit: AuditData;
  mapAction: HashMap<string> = {
    ADD: 'Add settings',
    DELETE: 'Delete settings',
    EDIT: 'Edit settings'
  };

  comparedFields = [
    {
      path: ['popupConfig', 'defaultPopupShowedOn'],
      label: 'Popup show on',
      enumeration: {
        webNapp: 'Web and desktop application',
        web: 'Web application',
        app: 'Desktop application'
      }
    },
    {
      path: ['defaultWrapUpTimeInSeconds'],
      label: 'Default wrap up time'
    },
    {
      path: ['popupConfig', 'popupFields', ['fieldName']],
      attach: ['fieldValue'],
      label: 'Addon fields'
    },
    {
      path: ['defaultSmsPerCallerInDay'],
      label: 'Maximum SMS to each caller per day'
    },
    {
      path: ['crmIntegration', 'url'],
      label: 'Crm url'
    },
    {
      path: ['crmIntegration', 'headerFields', ['fieldName']],
      attach: ['fieldValue'],
      label: 'Crm Headers'
    },
    {
      path: ['crmIntegration', 'fields', ['fieldName']],
      attach: ['fieldValue'],
      label: 'Crm Fields'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.audit = new AuditData();

    if (this.raw.clientInfo) {
      this.audit.ipAddress = this.raw.clientInfo.ipAddress;
    }
    this.audit.action = this.generateAuditAction(this.raw.auditData.action);

    let oldConfig = this.raw.auditData.oldOrgConfig;
    let newConfig = this.raw.auditData.newOrgConfig;

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

    if (field.enumeration) {
      value = field.enumeration[value];
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
