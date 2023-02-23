import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ExternalOAuthService, GOOGLE_CLIENT_ID, MS_TEAM_CLIENT_ID, ZOOM_CLIENT_ID } from '@b3networks/api/auth';
import { Extension, EXTENSION_PAGINATOR } from '@b3networks/api/bizphone';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { PaginatorPlugin } from '@datorama/akita';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-manage-connect-account.component',
  templateUrl: './manage-connect-account.component.html',
  styleUrls: ['./manage-connect-account.component.scss']
})
export class ManageConnectAccountComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  isLoadingGoogle = true;
  isEnableGoogle = false;

  isLoadingZoom = true;
  isEnableZoom = false;

  isLoadingMsTeam = true;
  isEnableMsTeam = false;

  constructor(
    @Inject(EXTENSION_PAGINATOR) public paginatorRef: PaginatorPlugin<Extension>,
    private dialogRef: MatDialogRef<ManageConnectAccountComponent>,
    private externalOAuthService: ExternalOAuthService,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.externalOAuthService
      .getGoogles()
      .pipe(finalize(() => (this.isLoadingGoogle = false)))
      .subscribe(
        g => {
          if (g.length > 0) {
            this.isEnableGoogle = g.find(app => app.app.clientId === GOOGLE_CLIENT_ID) ? true : false;
          }
        },
        error => {
          this.toastr.error(error.message);
        }
      );

    this.externalOAuthService
      .getmsTeamsMember()
      .pipe(finalize(() => (this.isLoadingMsTeam = false)))
      .subscribe(ms => {
        if (ms.length > 0) {
          this.isEnableMsTeam = ms.find(app => app.app.clientId === MS_TEAM_CLIENT_ID) ? true : false;
        }
      });

    this.externalOAuthService
      .getZooms()
      .pipe(finalize(() => (this.isLoadingZoom = false)))
      .subscribe(z => {
        if (z.length > 0) {
          this.isEnableZoom = z.find(app => app.app.clientId === ZOOM_CLIENT_ID) ? true : false;
        }
      });
  }

  enableGoogleConnector() {
    this.externalOAuthService.enableGoogle().subscribe(urlResponse => {
      if (urlResponse && urlResponse.url) {
        window.open(urlResponse.url);
      }
    });
  }

  disconnecGoogleConnector() {
    this.externalOAuthService
      .disconnectGoogle()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        _ => {
          this.isEnableGoogle = false;
        },
        error => {
          this.toastr.error(error.message);
        }
      );
  }

  enableMSTeamConnector() {
    this.externalOAuthService
      .enableMsTeamMember()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(urlResponse => {
        if (urlResponse && urlResponse.url) {
          window.open(urlResponse.url);
        }
      });
  }

  disconnectMSTeamConnector() {
    this.externalOAuthService
      .disconnectMsTeamMember()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        _ => {
          this.isEnableMsTeam = false;
        },
        error => {
          this.toastr.error(error.message);
        }
      );
  }

  enableZoomConnector() {
    this.externalOAuthService
      .enableZoom()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(urlResponse => {
        if (urlResponse && urlResponse.url) {
          window.open(urlResponse.url);
        }
      });
  }

  disconnectZoomConnector() {
    this.externalOAuthService
      .disconnectZoom()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        _ => {
          this.isEnableZoom = false;
        },
        error => {
          this.toastr.error(error.message);
        }
      );
  }
}
