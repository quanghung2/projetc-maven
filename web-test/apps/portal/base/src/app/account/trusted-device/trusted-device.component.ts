import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TrustedDeviceInfo, TrustedDeviceService } from '@b3networks/api/auth';
import { PagingService } from '../../shared/service/paging.service';

export class TrustedDeviceData {
  constructor(public device: TrustedDeviceInfo, public revoke = false, public processing = false) {}
}

@Component({
  selector: 'trusted-device',
  templateUrl: './trusted-device.component.html',
  styleUrls: ['trusted-device.component.scss']
})
export class TrustedDeviceComponent {
  trustedDevices: TrustedDeviceData[] = [];
  loading = true;

  displayedColumns = ['browser', 'ipAddress', 'datetime', 'action'];
  dataSource = new MatTableDataSource<TrustedDeviceData>(this.trustedDevices);

  pageOffset = 10;
  pageStart = 1;
  pagedDataSource: MatTableDataSource<TrustedDeviceData>;

  constructor(private trustedDeviceService: TrustedDeviceService, private pagingService: PagingService) {
    this.loading = true;
    trustedDeviceService.getTrustedDevices(0, 10).subscribe((response: TrustedDeviceInfo[]) => {
      this.loading = false;
      this.trustedDevices = response.map((item: TrustedDeviceInfo) => {
        return new TrustedDeviceData(item);
      });
      this.updateDataSource();
    });
  }

  private updateDataSource() {
    this.trustedDevices = this.filterTrustedDevices(this.trustedDevices);
    this.dataSource.data = this.trustedDevices;
    this.pagedDataSource = this.pagingService.getPagedLoginSessions<TrustedDeviceData>(
      this.pageOffset,
      this.pageStart,
      this.dataSource
    );
  }

  private filterTrustedDevices(devices: TrustedDeviceData[]) {
    return devices.filter((item: TrustedDeviceData) => {
      return !item.revoke;
    });
  }

  revoke(item: TrustedDeviceData) {
    item.processing = true;
    this.trustedDeviceService.revokeDevice(item.device.uuid).subscribe(response => {
      item.revoke = true;
      item.processing = false;
      this.updateDataSource();
    });
  }

  pageChanged(pageEvent: PageEvent) {
    this.pagedDataSource = this.pagingService.getPagedLoginSessions<TrustedDeviceData>(
      this.pageOffset,
      pageEvent.pageIndex + 1,
      this.dataSource
    );
  }
}
