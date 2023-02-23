import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModeSidebar } from '../../core/state/app-state.model';
import { AppQuery } from '../../core/state/app.query';
import { AppService } from '../../core/state/app.service';

@Component({
  selector: 'csh-menu-toggle',
  templateUrl: './menu-toggle.component.html',
  styleUrls: ['./menu-toggle.component.scss']
})
export class MenuToggleComponent implements OnInit {
  toggleLeftSidebar$: Observable<boolean>;
  isOverModeLeftSidebar$: Observable<boolean>;
  mentionCountTeamChat$: Observable<number>;

  constructor(private appQuery: AppQuery, private appService: AppService) {}

  ngOnInit() {
    this.mentionCountTeamChat$ = this.appQuery.mentionCountTeamChat$;
    this.toggleLeftSidebar$ = this.appQuery.showLeftSidebar$;
    this.isOverModeLeftSidebar$ = this.appQuery.modeLeftSidebar$.pipe(map(mode => mode === ModeSidebar.over));
  }

  viewMenu(toggleInfoBtn: boolean) {
    const mode = this.appQuery.getValue()?.modeRightSidebar;
    if (mode === ModeSidebar.over) {
      this.appService.update({
        showLeftSidebar: !toggleInfoBtn
      });
    }
  }
}
