import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { LicenseStatistic } from '@b3networks/api/license';

@Component({
  selector: 'b3n-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss']
})
export class LicenseComponent implements OnInit {
  selectedLicense: LicenseStatistic | null;

  @ViewChild(MatDrawer) rightSidebar: MatDrawer;

  constructor() {}

  ngOnInit(): void {}

  showDetails(license: LicenseStatistic) {
    this.selectedLicense = license;
    this.rightSidebar.open();
  }
}
