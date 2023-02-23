import { Component, Directive, ViewEncapsulation } from '@angular/core';
import { PersonalSettingsQuery, PersonalSettingsService, UnifiedWorkspaceSetting } from '@b3networks/api/portal';
import { APP_IDS, X } from '@b3networks/shared/common';
import { ModeSidebar } from '../../core/state/app-state.model';
import { AppQuery } from '../../core/state/app.query';
import { AppService } from '../../core/state/app.service';

@Directive({
  selector: 'csh-right-sidebar-title',
  host: { class: 'csh-right-sidebar-title' }
})
export class RightSidebarTitle {}

@Directive({
  selector: 'csh-right-sidebar-subtitle',
  host: { class: 'csh-right-sidebar-subtitle' }
})
export class RightSidebarSubTitle {}

@Directive({
  selector: 'csh-right-sidebar-action',
  host: { class: 'csh-right-sidebar-action' }
})
export class RightSidebarAction {}

@Directive({
  selector: 'csh-right-sidebar-info',
  host: { class: 'csh-right-sidebar-info' }
})
export class RightSidebarInfo {}

@Directive({
  selector: 'csh-right-sidebar-primary',
  host: { class: 'csh-right-sidebar-primary' }
})
export class RightSidebarPrimary {}

@Directive({
  selector: 'csh-right-sidebar-actions',
  host: { class: 'csh-right-sidebar-actions' }
})
export class RightSidebarActions {}

@Directive({
  selector: 'csh-right-sidebar-extend',
  host: { class: 'csh-right-sidebar-extend' }
})
export class RightSidebarExtend {}

@Component({
  selector: 'csh-right-sidebar-header',
  templateUrl: './right-sidebar-header.component.html',
  host: { class: 'csh-right-sidebar-header' },
  encapsulation: ViewEncapsulation.None
})
export class RightSidebarHeader {
  ref: any;

  constructor(
    private personalSettingsQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private appQuery: AppQuery,
    private appService: AppService
  ) {}

  close() {
    const mode = this.appQuery.getValue()?.modeRightSidebar;
    if (mode === ModeSidebar.side) {
      const settings = <UnifiedWorkspaceSetting>(
        this.personalSettingsQuery.getAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
      );
      settings.showRightSidebar = false;
      this.personalSettingService.updateAppSettings(settings).subscribe();
    } else if (mode === ModeSidebar.over) {
      this.appService.update({
        showRightSidebar: false
      });
    }
  }
}

@Component({
  selector: 'csh-right-sidebar-content',
  templateUrl: './right-sidebar-content.component.html',
  host: { class: 'csh-right-sidebar-content' },
  encapsulation: ViewEncapsulation.None
})
export class RightSidebarContent {}

@Component({
  selector: 'csh-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
  host: { class: 'csh-right-sidebar' },
  encapsulation: ViewEncapsulation.None
})
export class RightSidebarComponent {}
