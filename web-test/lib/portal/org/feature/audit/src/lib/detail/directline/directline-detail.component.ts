import { Component, Input, OnInit } from '@angular/core';
import { FieldChangeDirectline } from '@b3networks/api/audit';

@Component({
  selector: 'poa-directline-detail',
  templateUrl: './directline-detail.component.html',
  styleUrls: ['./directline-detail.component.scss']
})
export class DirectlineDetailComponent implements OnInit {
  columns = ['field', 'changes'];
  histories = [];
  @Input('rawData') rawData: any;

  constructor() {}

  ngOnInit(): void {
    switch (this.rawData.auditName) {
      case 'addNewNumbersToBlockList':
        this.add();
        break;
      case 'importFromRecentCallsToBlockList':
      case 'removeNumberFromBlockList':
        this.import();
        break;
      case 'editForwardConfig':
        this.editForwardConfig();
        break;
      case 'updateNotificationConfig':
        this.updateNotificationConfig();
        break;
      case 'editLabel':
        this.editLabel();
        break;
      default:
        break;
    }
  }

  add() {
    const newData = this.rawData.auditData.newData[FieldChangeDirectline[this.rawData.auditName]];
    this.histories.push({ field: FieldChangeDirectline[this.rawData.auditName], value: newData });
  }

  import() {
    const newData = this.rawData.auditData.newData[FieldChangeDirectline[this.rawData.auditName]];
    this.histories.push({ field: FieldChangeDirectline[this.rawData.auditName], value: newData });
  }

  editLabel() {
    const newData = this.rawData.auditData.newData[FieldChangeDirectline[this.rawData.auditName]];
    const oldData = this.rawData.auditData.oldData[FieldChangeDirectline[this.rawData.auditName]];
    this.histories.push({ field: FieldChangeDirectline[this.rawData.auditName], value: oldData + ' -> ' + newData });
  }

  editForwardConfig() {
    const oldData = this.rawData.auditData.oldData;
    const newData = this.rawData.auditData.newData;
    for (const field of Object.keys(newData[0])) {
      if (field !== 'scheduleConfig' && this.customValue(newData, field) !== this.customValue(oldData, field)) {
        this.histories.push({
          field: field,
          value: this.customValue(newData, field) + ' -> ' + this.customValue(oldData, field)
        });
      }
    }
  }

  updateNotificationConfig() {
    const oldData = this.rawData.auditData.oldData;
    const newData = this.rawData.auditData.newData;
    for (const field of Object.keys(oldData)) {
      if (newData[field] !== oldData[field]) {
        this.histories.push({ field: field, value: oldData[field] + ' -> ' + newData[field] });
      }
    }
  }

  customValue(values: Array<string>, field: string) {
    const resultData = [];
    if (values) {
      values.forEach(value => {
        resultData.push(value[field]);
      });
    }
    return JSON.stringify(resultData);
  }
}
