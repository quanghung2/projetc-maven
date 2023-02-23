import { Component, OnInit } from '@angular/core';

declare let X: any;

@Component({
  selector: 'history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  link = window.parent.location.origin + `/#/` + X.orgUuid + `/manage-organization?menu=call-history`;

  constructor() {}

  ngOnInit() {}

  navigateLink() {
    (window.parent.document || window.document).location.replace(this.link);
  }
}
