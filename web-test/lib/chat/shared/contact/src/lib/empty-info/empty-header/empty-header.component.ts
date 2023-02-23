import { Component, Input, OnInit } from '@angular/core';
import { Contact } from '@b3networks/api/contact';
import { PersonalSettingsQuery, PersonalSettingsService, UnifiedWorkspaceSetting } from '@b3networks/api/portal';
import { User } from '@b3networks/api/workspace';
import { AppQuery, AppService, ModeSidebar } from '@b3networks/chat/shared/core';
import { APP_IDS, X } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-empty-header',
  templateUrl: './empty-header.component.html',
  styleUrls: ['./empty-header.component.scss']
})
export class EmptyHeaderComponent implements OnInit {
  @Input() contact: Contact;
  @Input() user: User;

  toggleInfoBtn$: Observable<boolean>;

  constructor(
    private personalSettingsQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private appQuery: AppQuery,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.toggleInfoBtn$ = this.appQuery.modeRightSidebar$.pipe(
      switchMap(mode =>
        mode === ModeSidebar.side
          ? this.personalSettingsQuery
              .selectAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
              .pipe(map(result => (<UnifiedWorkspaceSetting>result)?.showRightSidebar))
          : this.appQuery.showRightSidebar$
      )
    );
  }

  toggleRightSidebar() {
    this.updateSideBarSettings(null);
  }

  private updateSideBarSettings(isShow: boolean) {
    const mode = this.appQuery.getValue()?.modeRightSidebar;
    if (mode === ModeSidebar.side) {
      const settings = <UnifiedWorkspaceSetting>(
        this.personalSettingsQuery.getAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
      );
      if (settings) {
        if (isShow === null) {
          // toggle
          settings.showRightSidebar = !settings.showRightSidebar;
          this.personalSettingService.updateAppSettings(settings).subscribe();
        } else {
          if (settings.showRightSidebar !== isShow) {
            settings.showRightSidebar = isShow;
            this.personalSettingService.updateAppSettings(settings).subscribe();
          }
        }
      } else {
        setTimeout(() => {
          this.updateSideBarSettings(isShow);
        }, 100);
      }
    } else if (mode === ModeSidebar.over) {
      // toggle
      this.appService.update({
        showRightSidebar: !this.appQuery.getValue()?.showRightSidebar
      });
    }
  }
}
