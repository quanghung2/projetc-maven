import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Channel, ChannelQuery } from '@b3networks/api/store';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-list-channel',
  templateUrl: './list-channel.component.html',
  styleUrls: ['./list-channel.component.scss']
})
export class ListChannelComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  displayedColumns = ['orgUuid', 'channel', 'createDate'];
  dataSource = new MatTableDataSource<Channel>();

  loading: boolean;
  searchValue: string;

  constructor(private router: Router, private channelQuery: ChannelQuery, private toastService: ToastService) {
    super();
  }

  ngOnInit(): void {
    this.loading = true;

    this.channelQuery
      .selectAll()
      .pipe(finalize(() => (this.loading = false)))
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        channels => {
          this.updateDataSource(channels);
          this.loading = false;
        },
        error => {
          this.toastService.error('Cannot get channels. Please try again later');
          this.loading = false;
        }
      );
  }

  openChanelDetail(channel: Channel) {
    this.router.navigate(['channel', 'detail', channel.partnerUuid]);
  }

  onSearchChannel(event) {
    const text: string = event.target.value;
    const channels = this.channelQuery.getAll();
    if (text?.trim().length) {
      const data = channels.filter(item => {
        if (
          item.partnerName?.toLowerCase().includes(text.toLowerCase()) ||
          item.partnerUuid?.toLowerCase() === text.toLowerCase()
        ) {
          return item;
        }
        return null;
      });

      this.updateDataSource(data);
      return;
    }

    this.updateDataSource(channels);
  }

  copied() {
    this.toastService.success('Copied successfully');
  }

  copyFailed() {
    this.toastService.error('Failed to copy');
  }

  reset() {
    this.searchValue = '';
    this.channelQuery
      .selectAll()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(channels => {
        this.updateDataSource(channels);
      });
  }

  private updateDataSource(data: Channel[]) {
    this.dataSource = new MatTableDataSource<Channel>(data);
    this.dataSource.paginator = this.paginator;
  }
}
