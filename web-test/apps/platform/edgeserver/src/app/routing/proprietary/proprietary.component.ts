import { KeyValue } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MATCHING, Peer, Record, RoutingService, Table } from '@b3networks/api/edgeserver';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { ProprietaryModalComponent, ProprietaryModalInput } from '../proprietary-modal/proprietary-modal.component';

@Component({
  selector: 'b3n-proprietary',
  templateUrl: './proprietary.component.html',
  styleUrls: ['./proprietary.component.scss']
})
export class ProprietaryComponent implements OnInit {
  @Input() cluster: string;
  @Input() peers: Peer[];
  @Input() tables: Table[];
  @Input() table: Table;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  readonly matchings: KeyValue<MATCHING, string>[] = [
    { key: MATCHING.lpm, value: 'Longest prefix matching' },
    { key: MATCHING.em, value: 'Exactly matching' },
    { key: MATCHING.eq, value: 'Equal' },
    { key: MATCHING.ne, value: 'Not equal' },
    { key: MATCHING.gt, value: 'Greater than' },
    { key: MATCHING.lt, value: 'Less than' },
    { key: MATCHING.ge, value: 'Greater than or equal' },
    { key: MATCHING.le, value: 'Less than or equal' }
  ];

  isLoading: boolean;
  displayedColumns: string[] = ['matching', 'value', 'action', 'primary', 'secondary', 'load', 'actions'];
  dataSource = new MatTableDataSource<Record>();
  filterCtrl = new UntypedFormControl();

  constructor(private dialog: MatDialog, private routingService: RoutingService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.getData();

    this.filterCtrl.valueChanges.subscribe(val => {
      this.dataSource.filter = val;
      this.dataSource.paginator.firstPage();
    });
  }

  private getData() {
    this.isLoading = true;
    this.routingService
      .getDetailTable(this.cluster, this.table.name)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(schema => {
        this.dataSource = new MatTableDataSource<Record>(schema.records);
        this.dataSource.filterPredicate = (data: Record, filter: string) => {
          return data.value.toLowerCase().includes(filter);
        };
        this.dataSource.paginator = this.paginator;
      });
  }

  getTypeMatching(key: MATCHING) {
    return this.matchings.find(m => m.key === key).value;
  }

  createRecord() {
    this.dialog
      .open(ProprietaryModalComponent, {
        width: '500px',
        disableClose: true,
        data: <ProprietaryModalInput>{
          recordData: null,
          cluster: this.cluster,
          peers: this.peers,
          tables: this.tables.filter(t => t.name !== this.table.name),
          tableName: this.table.name
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getData();
        }
      });
  }

  editRecord(record: Record) {
    this.dialog
      .open(ProprietaryModalComponent, {
        width: '500px',
        disableClose: true,
        data: <ProprietaryModalInput>{
          recordData: record,
          cluster: this.cluster,
          peers: this.peers,
          tables: this.tables.filter(t => t.name !== this.table.name),
          tableName: this.table.name
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getData();
        }
      });
  }

  deleteRecord(record: Record) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        disableClose: true,
        data: <ConfirmDialogInput>{
          title: 'Delete record',
          message: 'Are you sure you want to delete this record?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.routingService.deleteRecordRouting(this.cluster, this.table.name, record).subscribe(
            _ => {
              this.toastService.success('Delete record successfully');
              this.getData();
            },
            error => {
              this.toastService.error(error);
            }
          );
        }
      });
  }
}
