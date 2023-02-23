import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CreatedAccessLinkReq,
  Dashboard,
  PublicAccess,
  PublicAccessService,
  PublicAccessStatus
} from '@b3networks/api/dashboard';
import { DomainUtilsService } from '@b3networks/shared/common';
import { finalize, mergeMap } from 'rxjs/operators';

enum State {
  existed,
  noLink,
  creating
}

@Component({
  selector: 'b3n-public-access',
  templateUrl: './public-access.component.html',
  styleUrls: ['./public-access.component.scss']
})
export class PublicAccessComponent implements OnInit {
  dashboard: Dashboard;
  accessLink: PublicAccess;

  password: string;

  state: State;
  fetching: boolean;
  progressing: boolean;

  portalUrl: string;

  readonly State = State;
  @ViewChild('publicLinkText') publicLinkText: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) dashboard: Dashboard,
    private dialogRef: MatDialogRef<PublicAccessComponent>,
    private publicAccessService: PublicAccessService,
    private domainUtil: DomainUtilsService
  ) {
    this.dashboard = dashboard;
    this.portalUrl = `https://${this.domainUtil.getPortalDomain()}`;
  }

  get publicAccessLink() {
    return `${this.portalUrl}/dashboards/#/${this.accessLink.ref}`;
  }

  ngOnInit() {
    this.fetching = true;
    this.publicAccessService
      .fetchAll()
      .pipe(finalize(() => (this.fetching = false)))
      .subscribe(links => {
        this.accessLink = links.find(
          item => item.dashboardUuid === this.dashboard.uuid && item.status === PublicAccessStatus.active
        );
        this.state = this.accessLink ? State.existed : State.noLink;
      });
  }

  createPublicLink() {
    this.progressing = true;
    this.publicAccessService
      .create(<CreatedAccessLinkReq>{
        name: this.dashboard.name,
        dashboardUuid: this.dashboard.uuid,
        password: this.password
      })
      .pipe(
        mergeMap(_ => this.publicAccessService.fetchAll()),
        finalize(() => (this.progressing = false))
      )
      .subscribe(links => {
        this.accessLink = links.find(
          item => item.dashboardUuid === this.dashboard.uuid && item.status === PublicAccessStatus.active
        );
        this.state = this.accessLink ? State.existed : State.noLink;
      });
  }

  copy() {
    this.publicLinkText.nativeElement.select();
    document.execCommand('copy');
    this.dialogRef.close();
  }

  revoke() {
    this.progressing = true;
    this.publicAccessService
      .revoke(this.accessLink)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(_ => {
        this.dialogRef.close();
      });
  }
}
