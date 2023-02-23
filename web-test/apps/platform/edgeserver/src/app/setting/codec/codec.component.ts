import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CodecProfile, CodecService, PreConfig, PreConfigQuery } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import { CodecModalComponent, CodecModalInput } from '../codec-modal/codec-modal.component';

@Component({
  selector: 'b3n-codec',
  templateUrl: './codec.component.html',
  styleUrls: ['./codec.component.scss']
})
export class CodecComponent extends DestroySubscriberComponent implements OnChanges {
  @Input() cluster: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns: string[] = ['name', 'codec', 'action'];
  codecProfile = new MatTableDataSource<CodecProfile>();
  isLoading: boolean;
  preConfig: PreConfig;

  constructor(
    private codecService: CodecService,
    private dialog: MatDialog,
    private preConfigQuery: PreConfigQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnChanges(): void {
    this.getCodec();
    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.preConfig = res;
      });
  }

  showCreateCodec() {
    this.dialog
      .open(CodecModalComponent, {
        width: '520px',
        data: {
          isEdit: false,
          preConfig: this.preConfig,
          codecs: [...this.codecProfile?.filteredData],
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Add codec successfully');
          this.getCodec();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editCodec(codec: CodecProfile) {
    this.dialog
      .open(CodecModalComponent, {
        width: '520px',
        data: <CodecModalInput>{
          isEdit: true,
          codec: codec,
          preConfig: this.preConfig,
          cluster: this.cluster,
          codecs: [...this.codecProfile?.filteredData]
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Edit codec successfully');
          this.getCodec();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  confirmDeleteCodec(codec: CodecProfile) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Codec',
          message: 'Are you sure you want to delete this codec?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteCodec(codec);
        }
      });
  }

  private deleteCodec(codec: CodecProfile) {
    this.codecService.deleteCodecProfile(codec.name, this.cluster).subscribe(
      res => {
        this.getCodec();
        this.toastService.success('Delete codec successfully');
      },
      error => this.toastService.error(error)
    );
  }

  private getCodec() {
    this.isLoading = true;
    this.codecService
      .getCodecProfile(this.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        codecs => {
          const data = codecs?.sort((a, b) => {
            return ('' + a.name).localeCompare(b.name);
          });
          this.codecProfile = new MatTableDataSource<CodecProfile>(data);
          this.codecProfile.paginator = this.paginator;
        },
        error => this.toastService.error(error)
      );
  }
}
