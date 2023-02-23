import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { GeoCountryResponse, GeoQuery, GeoService } from '@b3networks/api/auth';
import { DataLoginHistory, LoginHistoryService } from '@b3networks/api/data';
import { SessionService } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent, MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'b3n-login-activity',
  templateUrl: 'login-activity.component.html',
  styleUrls: ['login-activity.component.scss']
})
export class LoginActivityComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  hasOtherSessions: boolean;
  currentCountry: string;
  currentIpAddress: string;
  signoutSuccessful = false;
  loading = true;
  @Output() gotoPasswordSettingsEvent = new EventEmitter();

  displayedColumns = ['device', 'location', 'status', 'duration', 'datetime'];
  dataSource: MatTableDataSource<DataLoginHistory> = new MatTableDataSource<DataLoginHistory>();

  signingOut: boolean;

  constructor(
    private sessionService: SessionService,
    private geoService: GeoService,
    private toastService: ToastService,
    private geoQuery: GeoQuery,
    private loginHistoryService: LoginHistoryService
  ) {
    super();
  }

  ngOnInit() {
    this.geoService.getGeoInfo().subscribe();
    this.geoQuery.geo$.subscribe((response: GeoCountryResponse) => {
      this.updateGeoInfo(response);
    });

    this.initData();
  }

  private initData() {
    this.loading = true;
    this.signoutSuccessful = false;
    this.loginHistoryService
      .getLoginHistory()
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.loading = false))
      )
      .subscribe(res => {
        this.dataSource.data = res.data;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        });
      });
  }

  private updateGeoInfo(data: GeoCountryResponse) {
    if (!data.isDefault) {
      this.currentCountry = data.countryName;
      this.currentIpAddress = data.ipAddress;
    }
  }

  signOutOtherLoginSession() {
    this.signingOut = true;
    this.sessionService.logout().subscribe(
      _ => {
        this.signingOut = false;
        this.signoutSuccessful = true;
      },
      _ => {
        this.signingOut = false;
        this.toastService.warning(MessageConstants.GENERAL_ERROR);
      }
    );
  }

  gotoPasswordSettings() {
    this.gotoPasswordSettingsEvent.emit('gotoPasswordSettings');
  }
}
