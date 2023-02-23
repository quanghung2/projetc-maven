import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { OrgConfig, OrgConfigQuery, OrgConfigService } from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-remarks-dialog',
  templateUrl: './remarks-dialog.component.html',
  styleUrls: ['./remarks-dialog.component.scss']
})
export class RemarksDialogComponent implements OnInit {
  @ViewChild('remark') remark: ElementRef;
  remarks: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<RemarksDialogComponent>,
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private spinner: LoadingSpinnerSerivce,
    public toastService: ToastService
  ) {}

  ngOnInit() {
    this.orgConfigQuery.busyRemarks$.subscribe(remarks => {
      if (remarks) {
        this.remarks = [...remarks];
      }
    });

    this.orgConfigQuery.selectLoading().subscribe(loading => {
      loading ? this.spinner.showSpinner() : this.spinner.hideSpinner();
    });

    this.orgConfigService.getConfig().subscribe(
      _ => {},
      err => {
        this.toastService.error(err.message);
      }
    );
  }

  addRemark(remark: string) {
    this.remark.nativeElement.value = '';
    if (remark === '') {
      return;
    }

    if (!this.remarks) {
      return;
    }

    if (this.remarks.includes(remark)) {
      return;
    }

    this.remarks.push(remark);
  }

  deleteRemark(remark: string) {
    if (!this.remarks) {
      return;
    }

    this.remarks.splice(this.remarks.indexOf(remark), 1);
  }

  save() {
    this.spinner.showSpinner();
    this.orgConfigService
      .updateConfig(new OrgConfig({ remarks: this.remarks }))
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        res => {
          this.toastService.success('Busy remarks have been updated');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
    this.dialogRef.close();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.remarks, event.previousIndex, event.currentIndex);
  }
}
