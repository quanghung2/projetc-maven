import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '@b3networks/api/auth';
import { LicenseStatistic, LicenseStatQuery, LicenseStatService } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-licenses',
  templateUrl: './licenses.component.html',
  styleUrls: ['./licenses.component.scss']
})
export class LicensesComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  managedTeams: Team[] = [];

  dataSource = new MatTableDataSource<LicenseStatistic>();
  readonly displayedColumns = ['name', 'available', 'assigned'];
  isLoading: boolean;

  constructor(
    private licenseStatQuery: LicenseStatQuery,
    private licenseStatService: LicenseStatService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.licenseStatQuery.baseLicenses$.pipe(takeUntil(this.destroySubscriber$)).subscribe(result => {
      this.dataSource.data = result.sort();
      this.dataSource.paginator = this.paginator;
    });

    this.getData();
  }

  getData() {
    this.isLoading = true;
    this.licenseStatService
      .getLicenseStatistics()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe();
  }

  showDetails(license: LicenseStatistic) {
    this.router.navigate([license.sku], { relativeTo: this.route });
  }
}
