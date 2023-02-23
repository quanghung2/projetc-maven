import { Component, OnInit } from '@angular/core';
import { X } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-bac-app',
  templateUrl: './bac-app.component.html',
  styleUrls: ['./bac-app.component.scss']
})
export class BacAppComponent implements OnInit {
  showAction: boolean;
  showRelationship: boolean;
  showTabRelationship: boolean;

  ngOnInit(): void {
    this.showAction = true;
    const orgAllowShowRelationship: string[] = ['fc312420-0047-49a7-94a8-003f11f115c0'];
    this.showTabRelationship = orgAllowShowRelationship.indexOf(X.orgUuid) !== -1;
  }

  tabChange(index: number) {
    switch (index) {
      case 0:
        this.showAction = true;
        this.showRelationship = false;
        break;
      case 1:
        this.showAction = false;
        this.showRelationship = true;
        break;
    }
  }
}
