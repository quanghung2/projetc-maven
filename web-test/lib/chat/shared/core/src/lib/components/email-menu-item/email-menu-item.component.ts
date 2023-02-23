import { Component, Input } from '@angular/core';
import { EmailMenuItem } from '../../core/model/email-menu-item.model';
import { ModeSidebar } from '../../core/state/app-state.model';
import { AppQuery } from '../../core/state/app.query';
import { AppService } from '../../core/state/app.service';

@Component({
  selector: 'b3n-email-menu-item',
  templateUrl: './email-menu-item.component.html',
  styleUrls: ['./email-menu-item.component.scss']
})
export class EmailMenuItemComponent {
  @Input() menu: EmailMenuItem;

  constructor(private appService: AppService, private appQuery: AppQuery) {}

  closeSidebar($event) {
    $event.stopPropagation();
    const mode = this.appQuery.getValue()?.modeLeftSidebar;
    if (mode === ModeSidebar.over) {
      setTimeout(() => {
        this.appService.update({
          showLeftSidebar: false
        });
      }, 50);
    }
  }
}
