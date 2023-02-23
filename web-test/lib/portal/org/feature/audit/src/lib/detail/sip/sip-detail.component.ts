import { Component, Input, OnInit } from '@angular/core';
import { FieldChange } from '@b3networks/api/audit';

@Component({
  selector: 'poa-sip-detail',
  templateUrl: './sip-detail.component.html',
  styleUrls: ['./sip-detail.component.scss']
})
export class SipDetailComponent implements OnInit {
  columns = ['field', 'changes'];
  histories = [];
  @Input('rawData') rawData: any;

  constructor() {}

  ngOnInit(): void {
    switch (this.rawData.auditName) {
      case 'addIpWhiteList':
      case 'addCountryWhiteList':
        this.add();
        break;
      case 'createDialPlan':
      case 'deleteDialPlan':
        this.dialPlan();
        break;
      case 'copyPassword':
        this.copy();
        break;
      case 'removeIpWhiteList':
      case 'removeCountryWhiteList':
        this.remove();
        break;
      case 'updateCompliance':
      case 'updateCallerId':
      case 'updateLabel':
      case 'updateType':
      case 'updatePassword':
      case 'enabledIncomingPinLogin':
      case 'enabledOutgoingPinLogin':
      case 'disabledOutgoingPinLogin':
      case 'disabledIncomingPinLogin':
        this.update();
        break;
      case 'disableBackupLine':
      case 'enableBackupLine':
        this.backupLine();
        break;
      case 'updateDialPlan':
        this.updateDialPlan();
        break;
      default:
        break;
    }
  }

  add() {
    const newData = this.rawData.auditData.newData[FieldChange[this.rawData.auditName]][0];
    this.histories.push({ field: FieldChange[this.rawData.auditName], value: newData });
  }

  dialPlan() {
    const data =
      this.rawData.auditName === 'createDialPlan' ? this.rawData.auditData.newData : this.rawData.auditData.oldData;
    const action = data[FieldChange[this.rawData.auditName]][0]['action'];
    const matcher = data[FieldChange[this.rawData.auditName]][0]['matcher'];
    for (const a of Object.keys(action)) {
      this.histories.push({ field: a, value: action[a] });
    }
    for (const m of Object.keys(matcher)) {
      this.histories.push({ field: m, value: matcher[m] });
    }
  }
  updateDialPlan() {
    let oldDataLst: Array<object> = this.rawData.auditData.oldData[FieldChange[this.rawData.auditName]];
    let newDataLst: Array<object> = this.rawData.auditData.newData[FieldChange[this.rawData.auditName]];
    let oldDataUpdated;
    let newDataUpdated;
    for (let o in oldDataLst) {
      if (
        JSON.stringify(oldDataLst[o]['action']['numOfDigitRemoved']) !==
          JSON.stringify(newDataLst[o]['action']['numOfDigitRemoved']) ||
        JSON.stringify(oldDataLst[o]['action']['appendPrefix']) !==
          JSON.stringify(newDataLst[o]['action']['appendPrefix']) ||
        JSON.stringify(oldDataLst[o]['matcher']['startWiths']) !==
          JSON.stringify(newDataLst[o]['matcher']['startWiths']) ||
        JSON.stringify(oldDataLst[o]['matcher']['withLengths']) !==
          JSON.stringify(newDataLst[o]['matcher']['withLengths'])
      ) {
        oldDataUpdated = oldDataLst[o];
        newDataUpdated = newDataLst[o];
      }
    }

    this.histories.push({
      field: 'numOfDigitRemoved',
      value: oldDataUpdated.action['numOfDigitRemoved'] + ' <-> ' + newDataUpdated.action['numOfDigitRemoved']
    });
    this.histories.push({
      field: 'appendPrefix',
      value: oldDataUpdated.action['appendPrefix'] + ' <-> ' + newDataUpdated.action['appendPrefix']
    });
    this.histories.push({
      field: 'startWiths',
      value: oldDataUpdated.matcher['startWiths'] + ' <-> ' + newDataUpdated.matcher['startWiths']
    });
    this.histories.push({
      field: 'withLengths',
      value: oldDataUpdated.matcher['withLengths'] + ' <-> ' + newDataUpdated.matcher['withLengths']
    });
  }

  copy() {
    const newData = this.rawData.auditData.newData[FieldChange[this.rawData.auditName]];
    this.histories.push({ field: FieldChange[this.rawData.auditName], value: newData });
  }

  remove() {
    const oldData = this.rawData.auditData.oldData[FieldChange[this.rawData.auditName]];
    this.histories.push({ field: FieldChange[this.rawData.auditName], value: oldData });
  }

  update() {
    const oldData = this.rawData.auditData.oldData[FieldChange[this.rawData.auditName]];
    const newData = this.rawData.auditData.newData[FieldChange[this.rawData.auditName]];
    this.histories.push({ field: FieldChange[this.rawData.auditName], value: oldData + ' -> ' + newData });
  }

  backupLine() {
    const oldData = this.rawData.auditData.oldData;
    const newData = this.rawData.auditData.newData;
    this.histories.push({ field: 'strategy', value: oldData['strategy'] + ' -> ' + newData['strategy'] });
    this.histories.push({
      field: 'backupNumbers',
      value: JSON.stringify(oldData['backupNumbers'] || '') + ' -> ' + JSON.stringify(newData['backupNumbers'] || '')
    });
  }
}
