import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { LicenseStatistic } from '@b3networks/api/license';

export interface AddonStatsDetailInput {
  licenseStats: LicenseStatistic[];
}

@Component({
  selector: 'b3n-addon-stats-detail',
  templateUrl: './addon-stats-detail.component.html',
  styleUrls: ['./addon-stats-detail.component.scss']
})
export class AddonStatsDetailComponent implements OnInit {
  readonly displayedColumns = ['name', 'available', 'assigned'];

  dataSource: MatTableDataSource<LicenseStatistic>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(@Inject(MAT_DIALOG_DATA) private data: AddonStatsDetailInput) {}

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource(this.data.licenseStats.sort());
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }
}
