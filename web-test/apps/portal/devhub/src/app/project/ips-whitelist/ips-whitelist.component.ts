import { Component, OnInit, ViewChild } from '@angular/core';
import {
  APIKey,
  ApiKeyManagementService,
  ApiKeyQuery,
  IpAddress,
  IpsWhitelistService,
  IPWhiteList
} from '@b3networks/api/integration';
import { MatTableDataSource } from '@angular/material/table';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { AddIpWhitelistDialogComponent } from './add-ip-whitelist-dialog/add-ip-whitelist-dialog.component';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { StoreApiKeyComponent } from '../api-key-management/store-api-key/store-api-key.component';
import { ProjectQuery } from '@b3networks/api/flow';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-ips-whitelist',
  templateUrl: './ips-whitelist.component.html',
  styleUrls: ['./ips-whitelist.component.scss']
})
export class IpsWhitelistComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  loading: boolean;
  adding: boolean;
  dataSource: MatTableDataSource<IpAddress>;
  displayedColumns = ['ipAddress', 'actions'];
  ips: IpAddress[] = [];
  apiKey: APIKey;

  constructor(
    private ipsWhitelistService: IpsWhitelistService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private apiKeyService: ApiKeyManagementService,
    private apiKeyQuery: ApiKeyQuery,
    private projectQuery: ProjectQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.apiKeyQuery
      .select('apiKey')
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(apiKey => {
        this.apiKey = apiKey;

        if (this.apiKey && apiKey.id) {
          this.getListIpAddressByApiKeyId(apiKey.id);
        }
      });
  }

  confirmDelete(element: IPWhiteList) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          color: 'warn',
          title: 'Delete IP Whitelist',
          message: `Are you sure to delete the IP (<strong>${element?.ipAddress}</strong>) from whitelist? `,
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.delete(element);
        }
      });
  }

  openAddIpWhitelistDialog() {
    this.dialog
      .open(AddIpWhitelistDialogComponent, {
        width: '400px'
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.toastService.success('Added successfully');

          this.getListIpAddressByApiKeyId(this.apiKey.id);
        }
      });
  }

  createApiKey() {
    const subscriptionUuid = this.projectQuery.getActive()?.subscriptionUuid;
    this.dialog
      .open(StoreApiKeyComponent, {
        width: '400px',
        data: subscriptionUuid
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.apiKeyService
            .getDeveloperLicenses()
            .pipe(
              switchMap(licenses => {
                const license = licenses?.find(license => license?.subUuid === subscriptionUuid);
                return this.apiKeyService.getListIpAddressByApiKeyId(license?.assignedApiKeyId);
              })
            )
            .subscribe(ips => {
              this.ips = ips;
              this.updateDataSource();
            });
        }
      });
  }

  private getListIpAddressByApiKeyId(id: number) {
    this.apiKeyService
      .getListIpAddressByApiKeyId(id)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(ips => {
        this.ips = ips;
        this.updateDataSource();
      });
  }

  private updateDataSource() {
    this.dataSource = new MatTableDataSource<IpAddress>(this.ips);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  private delete(ip: IPWhiteList) {
    const apiKeyId = this.apiKeyQuery.getValue()?.apiKey?.id;
    const address = encodeURIComponent(ip.ipAddress);

    this.apiKeyService.deleteIpWhiteList(apiKeyId, address).subscribe(_ => {
      this.toastService.success('Deleted successfully');
      this.dataSource.data = [];
      this.getListIpAddressByApiKeyId(apiKeyId);
    });
  }
}
