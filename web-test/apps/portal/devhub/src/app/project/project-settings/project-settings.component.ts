import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Project, ProjectQuery } from '@b3networks/api/flow';
import { LicenseDevService } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { AssignMemberDialogComponent } from './assign-member-dialog/assign-member-dialog.component';
import { EditCapabilitiesDialogComponent } from './edit-capabilities-dialog/edit-capabilities-dialog.component';
import { RenameProjectDialogComponent } from './rename-project-dialog/rename-project-dialog.component';

export interface ProjectSettingsData {
  project: Project;
  assignedNumbers: string[];
  concurrentCall: number;
}

@Component({
  selector: 'b3n-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss']
})
export class ProjectSettingsComponent extends DestroySubscriberComponent implements OnInit {
  project$: Observable<Project>;
  data$: Observable<ProjectSettingsData>;
  editable: boolean;

  constructor(
    private projectQuery: ProjectQuery,
    private profileQuery: IdentityProfileQuery,
    private toastService: ToastService,
    private dialog: MatDialog,
    private licenseDevService: LicenseDevService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initData();

    this.profileQuery
      .select(state => state.currentOrg)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(profileOrg => !!profileOrg),
        take(1)
      )
      .subscribe(profileOrg => {
        this.editable = !profileOrg.isMember;
      });
  }

  initData() {
    this.data$ = this.projectQuery
      .selectActive()
      .pipe(filter(p => !!p && !!p.subscriptionUuid))
      .pipe(
        switchMap(project => {
          const subscriptionUuid = project.subscriptionUuid;

          return combineLatest([
            of(project),
            this.licenseDevService.getAssignedNumbersBySubscriptionUuid(subscriptionUuid),
            this.licenseDevService.getConcurrentCallBySubscriptionUuid(subscriptionUuid)
          ]);
        })
      )
      .pipe(
        map(
          ([project, numbers, cc]) =>
            <ProjectSettingsData>{
              project: project,
              assignedNumbers: numbers,
              concurrentCall: cc
            }
        )
      );
  }

  copied() {
    this.toastService.success('Copied to clipboard!');
  }

  rename(project: Project) {
    this.dialog.open(RenameProjectDialogComponent, {
      width: '400px',
      disableClose: true,
      data: project
    });
  }

  editCapabilities(project: Project) {
    this.dialog.open(EditCapabilitiesDialogComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: project
    });
  }

  assignMember(project: Project) {
    this.dialog.open(AssignMemberDialogComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: project
    });
  }
}
