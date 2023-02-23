import { Component, OnInit } from '@angular/core';
import { AppService, SidebarTabs } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-hyperspaces',
  templateUrl: './hyperspaces.component.html',
  styleUrls: ['./hyperspaces.component.scss']
})
export class HyperspacesComponent implements OnInit {
  constructor(private appService: AppService) {}

  ngOnInit() {
    this.appService.update({ sidebarTabActive: SidebarTabs.teamchat });
  }
}
