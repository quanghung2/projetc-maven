import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuditData } from '@b3networks/api/audit';
import { EditCallcenterModalComponent } from '../edit-callcenter-modal/edit-callcenter-modal.component';

@Component({
  selector: 'poa-edit-callcenter',
  templateUrl: './edit-callcenter.component.html',
  styleUrls: ['./edit-callcenter.component.scss']
})
export class EditCallcenterComponent implements OnInit {
  columns = ['change', 'valueChange'];
  @Input('audit') audit: AuditData;
  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  showModelDetail() {
    this.dialog.open(EditCallcenterModalComponent, {
      width: '750px',
      data: this.audit.details.changeList
    });
  }
}
