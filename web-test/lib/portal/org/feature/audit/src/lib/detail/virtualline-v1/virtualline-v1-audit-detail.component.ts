import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuditData, Change } from '@b3networks/api/audit';
import { AuditModalComponent } from '../../common/audit-modal/audit-modal.component';

@Component({
  selector: 'poa-virtualline-v1-audit-detail',
  templateUrl: './virtualline-v1-audit-detail.component.html',
  styleUrls: ['./virtualline-v1-audit-detail.component.scss']
})
export class VirtuallineV1AuditDetailComponent implements OnInit {
  columns = ['ipaddress', 'ipaddressValue', 'change', 'valueChange'];
  mapAction = {
    add: 'Add block',
    delete: 'Delete block',
    edit: 'Edit block'
  };
  @Input() audit: AuditData;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  showModelDetail(details: Change[], action: string) {
    const data = {
      details,
      action,
      mapAction: this.mapAction
    };
    this.dialog.open(AuditModalComponent, {
      width: '750px',
      data
    });
  }
}
