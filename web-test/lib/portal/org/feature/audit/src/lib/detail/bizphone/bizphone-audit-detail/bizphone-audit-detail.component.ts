import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FieldChangeBizPhone } from '@b3networks/api/audit';
import { BizphoneAuditModalComponent } from '../bizphone-audit-modal/bizphone-audit-modal.component';

@Component({
  selector: 'poa-bizphone-audit-detail',
  templateUrl: './bizphone-audit-detail.component.html',
  styleUrls: ['./bizphone-audit-detail.component.scss']
})
export class BizphoneAuditDetailComponent implements OnInit {
  columns = ['field', 'changes'];
  histories = [];
  oldData = {};
  newData = {};

  @Input() rawData: any;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.oldData =
      this.rawData.auditData.oldData && FieldChangeBizPhone[this.rawData.auditName]
        ? this.rawData.auditData.oldData[FieldChangeBizPhone[this.rawData.auditName]]
        : this.rawData.auditData.oldData;
    this.newData =
      this.rawData.auditData.newData && FieldChangeBizPhone[this.rawData.auditName]
        ? this.rawData.auditData.newData[FieldChangeBizPhone[this.rawData.auditName]]
        : this.rawData.auditData.newData;

    switch (this.rawData.auditName) {
      case 'assignDID':
      case 'toggleDebugMode':
      case 'togglePinLogin':
      case 'updateExtensionLabel':
      case 'externalTransferCallerId':
      case 'internalTransferCallerId':
      case 'callerid':
      case 'updateOutboundRule':
      case 'updateExtensionKey':
      case 'updatePickupPrefix':
        this.updateData();
        break;
      case 'deleteExt':
      case 'unassignDID':
        this.delete();
        break;
      case 'togglePasscode':
        this.togglePasscode();
        break;
      case 'updateCallRecordingConfig':
      case 'updateDnc':
      case 'updateExt':
      case 'createExtension':
      case 'updateExtensionGroup':
      case 'updateBlfGroup':
      case 'updateConferenceRoom':
      case 'updateDialPlan':
      case 'updateCallerIdPlan':
      case 'updateExtensionList':
      case 'updateDevice':
        this.mutilUpdateData();
        break;
      case 'createExt':
      case 'createExtensionGroup':
      case 'createBlfGroup':
      case 'createConferenceRoom':
      case 'createNewOutboundRule':
      case 'addDialPlan':
      case 'addCallerIdPlan':
      case 'applySIPGateway':
      case 'importMACAddress':
      case 'autoProvision':
      case 'addSipGwUsername':
      case 'addCountryWhiteList':
      case 'removeCountryWhiteList':
        this.createExt();
        break;
      case 'deleteExtensionGroup':
      case 'deleteBlfGroup':
      case 'deleteConferenceRoom':
      case 'deleteOutboundRule':
      case 'deleteDialPlan':
      case 'deleteCallerIdPlan':
      case 'deleteDevice':
        this.deleteExtensionGroup();
        break;
      default:
        break;
    }
  }
  delete() {
    this.histories.push({ field: FieldChangeBizPhone[this.rawData.auditName], value: this.oldData });
  }

  togglePasscode() {
    this.histories.push({
      field: FieldChangeBizPhone[this.rawData.auditName],
      value: this.oldData['passCode'] + ' : ' + this.oldData['usingPin'] + ' -> ' + this.newData['usingPin']
    });
  }

  updateData() {
    this.histories.push({
      field: FieldChangeBizPhone[this.rawData.auditName],
      value: this.customValue(this.oldData) + ' -> ' + this.customValue(this.newData)
    });
  }

  mutilUpdateData() {
    for (const field in this.newData) {
      if (typeof this.newData[field] == 'object') {
        this.histories.push({ field: field, value: '', isChild: false });
        const childNewData = this.newData[field];
        const childOldData = this.oldData ? this.oldData[field] : '';
        for (const fieldOfChild in childNewData) {
          this.addHistory(childOldData, childNewData, fieldOfChild, true);
        }
        if (this.histories[this.histories.length - 1].field === field) {
          this.histories.splice(this.histories.length - 1, 1);
        }
      } else {
        this.addHistory(this.oldData, this.newData, field, false);
      }
    }
  }

  addHistory(oldData, newData, field: string, isChild: boolean) {
    if (!this.rawData.auditData.oldData) {
      this.histories.push({
        field: field,
        value: this.customValue(newData[field]),
        isChild: isChild
      });
    } else if (!oldData || !newData) {
      this.histories.push({
        field: field,
        value:
          (oldData ? this.customValue(oldData[field]) : '') +
          ' -> ' +
          (newData ? this.customValue(newData[field]) : ''),
        isChild: isChild
      });
    } else if (JSON.stringify(oldData[field]) != JSON.stringify(newData[field])) {
      this.histories.push({
        field: field,
        value: (this.customValue(oldData[field]) || '') + ' -> ' + (this.customValue(newData[field]) || ''),
        isChild: isChild
      });
    }
  }

  createExt() {
    if (this.newData) {
      for (const key in this.newData) {
        this.histories.push({ field: key, value: this.customValue(this.newData[key]) });
      }
    }
  }

  deleteExtensionGroup() {
    if (this.oldData) {
      for (const key in this.oldData) {
        this.histories.push({ field: key, value: this.customValue(this.oldData[key]) });
      }
    }
  }

  showModelDetail() {
    this.dialog.open(BizphoneAuditModalComponent, {
      width: '750px',
      data: this.histories
    });
  }

  customValue(data) {
    if (typeof data == 'object') {
      return JSON.stringify(data);
    } else if (typeof data == 'boolean' || typeof data == 'number') {
      return data.toString();
    } else {
      return data || '';
    }
  }
}
