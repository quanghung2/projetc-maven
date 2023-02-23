import { Component, Input, OnInit } from '@angular/core';
import { RollbackVersion } from '@b3networks/api/audit';

@Component({
  selector: 'poa-rollback-version',
  templateUrl: './rollback-version.component.html',
  styleUrls: ['./rollback-version.component.scss']
})
export class RollbackVersionComponent implements OnInit {
  columns = ['change', 'valueChanges'];
  @Input('raw') raw: any;
  public audit: RollbackVersion;

  constructor() {}

  ngOnInit(): void {
    this.audit = new RollbackVersion();
    if (this.raw.clientInfo) {
      this.audit.ipAddress = this.raw.clientInfo.ipAddress;
    }
    this.audit.version = this.raw.auditData.version;
  }
}
