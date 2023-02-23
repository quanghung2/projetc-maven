import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {
  AuditData,
  BizPhoneAuditDetails,
  CustomerQuery,
  EventNameDescription,
  ModuleDescription
} from '@b3networks/api/audit';
import { BaseAuditComponent } from '../common/base-audit.component';

@Component({
  selector: 'poa-apps-audit',
  templateUrl: './apps-audit.component.html',
  styleUrls: ['./apps-audit.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class AppsAuditComponent extends BaseAuditComponent implements OnInit, OnChanges {
  columnDefinitions = ['auditTime', 'action', 'user', 'target', 'ipAddress'];

  expandedElement: string | null;

  audits: AuditData[] = [];
  audit: BizPhoneAuditDetails;
  eventNames: EventNameDescription[] = [];
  auditName: string;
  nameColumnTarget = 'Target';

  @Input() rawData: any = [];
  @Input() appNameSelected: string;

  constructor(private customerQuery: CustomerQuery) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.generateAudit();
  }

  ngOnInit(): void {
    this.generateAudit();
  }

  isExpandedDetail(element): boolean {
    return this.appNameSelected === 'flow' && element.rawAction?.auditData?.details?.length;
  }

  private generateAudit() {
    const audits = [];
    this.nameColumnTarget = this.appNameSelected === 'workflow' ? 'Flow Name' : 'Target';

    if (this.rawData.length > 0) {
      this.auditName = this.rawData[0].moduleName;
      this.eventNames = this.customerQuery.getEventName(ModuleDescription[this.auditName.replace('-', '_')])?.eventName;
    }

    this.rawData.forEach(raw => {
      const auditItem = new AuditData();
      auditItem.userId =
        !raw.userInfo.displayName || raw.userInfo.displayName.length == 0
          ? raw.userInfo.identityUuid
          : raw.userInfo.displayName;
      auditItem.role = this.capitalize(raw.userInfo.role);
      auditItem.ipAddress = raw.clientInfo.ipAddress;
      auditItem.dateTime = raw.auditTime;
      auditItem.rawAction = raw.auditName;
      auditItem.action = this.generateAuditAction(raw.auditName);

      auditItem.target = this.initTarget(auditItem, raw);

      auditItem.rawData = raw;

      audits.push(auditItem);
    });

    this.audits = [...audits];
  }

  private generateAuditAction(action: string) {
    const eventName = this.eventNames?.find(item => item.name === action);
    if (!eventName) {
      return '-';
    }

    return eventName.description;
  }
  private initTarget(auditItem, raw) {
    let target = '';

    if (this.auditName == 'workflow') {
      if (raw.auditData.workFlowName) {
        target = raw.auditData.workFlowName;
      } else if (raw.auditData.tag && raw.auditData.number) {
        target = `${raw.auditData.number} (${raw.auditData.tag})`;
      }
    } else if (this.auditName === 'flow') {
      if (raw.auditData) {
        target = raw.auditData.target;
      }
    } else if (this.auditName === 'ms-data') {
      target = raw.remark;
    } else {
      const data = raw.auditData.oldData ? raw.auditData.oldData : raw.auditData.newData;
      if (data && auditItem.rawAction === 'assignDID') {
        target = data.number ? `Number: ${data.number}` : '';
      } else if (data && auditItem.rawAction === 'updateDnc') {
        target = data.target;
      } else if (data) {
        target = data.ext ? `Ext: ${data.ext}` : '';
      } else {
        target = '';
      }
    }

    return target;
  }
}
