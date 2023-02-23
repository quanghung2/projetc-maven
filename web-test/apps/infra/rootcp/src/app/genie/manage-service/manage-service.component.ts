import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SecurityPolicyDetail, SecurityService } from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { finalize, startWith, takeUntil } from 'rxjs';
import { EditPolicyComponent, EditPolicyInput } from './edit-policy/edit-policy.component';

@Component({
  selector: 'b3n-manage-service',
  templateUrl: './manage-service.component.html',
  styleUrls: ['./manage-service.component.scss']
})
export class ManageServiceComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  loading: boolean;
  searchCtrl = new UntypedFormControl();
  dataSource: MatTableDataSource<SecurityPolicyDetail> = new MatTableDataSource<SecurityPolicyDetail>();
  data: SecurityPolicyDetail[] = [];
  displayedColumns = ['domainUuid', 'portal', 'status', 'actions'];

  constructor(private dialog: MatDialog, private securityService: SecurityService) {
    super();
  }

  ngOnInit(): void {
    this.securityService.getSecurityPolicy(new Pageable(0, 1000)).subscribe(page => {
      this.data = page.content;
      if (!this.searchCtrl.value) {
        this.updateDataSource(this.data);
      } else {
        const data = this.data.filter(
          x =>
            x.key?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase()) ||
            x.portal?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase())
        );
        this.updateDataSource(data);
      }
    });

    this.searchCtrl.valueChanges.pipe(startWith(''), takeUntil(this.destroySubscriber$)).subscribe(value => {
      if (!value?.trim()) {
        this.updateDataSource(this.data);
        return;
      }
      const data = this.data.filter(
        x =>
          x.key?.toLowerCase().includes(value?.trim()?.toLowerCase()) ||
          x.portal?.toLowerCase().includes(value?.trim()?.toLowerCase())
      );
      this.updateDataSource(data);
    });
  }

  updateDataSource(items: SecurityPolicyDetail[]) {
    this.dataSource.data = items;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  edit(item: SecurityPolicyDetail) {
    this.dialog.open(EditPolicyComponent, {
      width: '500px',
      disableClose: true,
      data: <EditPolicyInput>{
        securityPolicyDetail: item
      }
    });
  }

  refresh() {
    this.loading = true;
    this.securityService
      .getSecurityPolicy(new Pageable(0, 1000))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(page => {
        this.dataSource.data = page.content;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        });
      });
  }
}
