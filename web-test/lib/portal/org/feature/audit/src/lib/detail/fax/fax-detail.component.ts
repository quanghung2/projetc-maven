import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'poa-fax-detail',
  templateUrl: './fax-detail.component.html',
  styleUrls: ['./fax-detail.component.scss']
})
export class FaxDetailComponent implements OnInit {
  columns = ['field', 'changes'];
  histories = [];
  @Input('rawData') rawData: any;

  constructor() {}

  ngOnInit(): void {
    switch (this.rawData.auditName) {
      case 'archiveFax':
      case 'downloadFax':
        this.updateFax();
        break;
      case 'updateNumberConfig':
        this.updateNumberConfig();
        break;
      default:
        break;
    }
  }

  updateFax() {
    const newData = this.rawData.auditData.newData;
    for (let field in newData) {
      this.histories.push({ field: field, value: newData[field] });
    }
  }
  updateNumberConfig() {
    const newData = this.rawData.auditData.newData.updatedNumberConfig.config;
    const oldData = this.rawData.auditData.oldData.originalNumberConfig.config;
    for (let field in newData) {
      if (JSON.stringify(newData[field]) !== JSON.stringify(oldData[field])) {
        this.histories.push({
          field: field,
          value: JSON.stringify(oldData[field]) + ' -> ' + JSON.stringify(newData[field])
        });
      }
    }
  }
}
