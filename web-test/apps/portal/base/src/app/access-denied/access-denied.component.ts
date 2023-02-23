import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SwitchOrganizationDialog } from '../shared/modal/switch-org/switch-org.component';

@Component({
  selector: 'b3n-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent implements OnInit {
  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  showSwitchOrganizationDialog() {
    this.dialog
      .open(SwitchOrganizationDialog, {
        width: '500px',
        position: {
          top: '40px'
        }
      })
      .afterClosed()
      .subscribe(_ => {});
  }
}
