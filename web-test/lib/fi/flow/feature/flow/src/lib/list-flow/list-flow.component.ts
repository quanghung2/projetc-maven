import { Component, OnInit } from '@angular/core';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-list-flow',
  templateUrl: './list-flow.component.html',
  styleUrls: ['./list-flow.component.scss']
})
export class ListFlowComponent implements OnInit {
  showForApp: AppName;
  AppName = AppName;

  constructor(private appStateQuery: AppStateQuery) {}

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
  }
}
