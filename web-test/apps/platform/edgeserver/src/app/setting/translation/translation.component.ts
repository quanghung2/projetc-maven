import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PreConfig, PreConfigQuery, TranslationProfile, TranslationService } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  TestTranslationModalComponent,
  TestTranslationModalInput
} from '../test-translation-modal/test-translation-modal.component';
import { TranslationModalComponent, TranslationModalInput } from '../translation-modal/translation-modal.component';

@Component({
  selector: 'b3n-translation',
  templateUrl: './translation.component.html',
  styleUrls: ['./translation.component.scss']
})
export class TranslationComponent extends DestroySubscriberComponent implements OnChanges {
  @Input() cluster: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns = ['name', 'pattern', 'replacement', 'action'];
  transactions = new MatTableDataSource<TranslationProfile>();
  isLoading: boolean;
  preConfig: PreConfig;

  constructor(
    private translationService: TranslationService,
    private dialog: MatDialog,
    private preConfigQuery: PreConfigQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnChanges(): void {
    this.getTranslation();
    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.preConfig = res;
      });
  }

  onCreateTransaction() {
    this.dialog
      .open(TranslationModalComponent, {
        width: '520px',
        data: <TranslationModalInput>{
          isEdit: false,
          preConfig: this.preConfig,
          translations: [...this.transactions?.filteredData],
          cluster: this.cluster
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.getTranslation();
          this.toastService.success('Add transaction successfully');
          return;
        }

        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editTranslation(translation: TranslationProfile) {
    this.dialog
      .open(TranslationModalComponent, {
        width: '520px',
        data: <TranslationModalInput>{
          isEdit: true,
          translation: translation,
          preConfig: this.preConfig,
          translations: [...this.transactions?.filteredData],
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Edit translation successfully');

          this.getTranslation();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  confirmDeleteTranslation(translation: TranslationProfile) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Translation',
          message: 'Are you sure you want to delete this translation?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteTranslation(translation);
        }
      });
  }

  onOpenTranslation(translation: TranslationProfile) {
    this.dialog.open(TestTranslationModalComponent, {
      width: '500px',
      data: <TestTranslationModalInput>{
        name: translation.name,
        cluster: this.cluster
      },
      disableClose: true
    });
  }

  private getTranslation() {
    this.isLoading = true;
    this.translationService
      .getTranslationProfile(this.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          const data = res?.sort((a, b) => {
            return ('' + a.name).localeCompare(b.name);
          });
          this.transactions = new MatTableDataSource<TranslationProfile>(data);
          this.transactions.paginator = this.paginator;
        },
        error => this.toastService.error(error)
      );
  }

  private deleteTranslation(translation: TranslationProfile) {
    this.translationService.deleteTranslationProfile(translation.name, this.cluster).subscribe(
      res => {
        this.getTranslation();
        this.toastService.success('Delete translation successfully');
      },
      err => {
        this.toastService.error(err);
      }
    );
  }
}
