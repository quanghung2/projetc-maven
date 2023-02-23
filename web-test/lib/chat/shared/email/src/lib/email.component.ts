import { Component, OnInit } from '@angular/core';
import { AppService, SidebarTabs } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-email',
  templateUrl: './email.component.html'
})
export class EmailComponent implements OnInit {
  constructor(private appService: AppService) {}

  ngOnInit() {
    this.appService.update({ sidebarTabActive: SidebarTabs.email });
  }
}
