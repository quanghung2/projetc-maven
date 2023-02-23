import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Pageable } from '@b3networks/api/common';
import { Consent, ConsentService } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { debounceTime, finalize, startWith, takeUntil } from 'rxjs/operators';
import { AddConsentNumberComponent } from './add-consent-number/add-consent-number.component';
import { ExportConsentComponent } from './export-consent/export-consent.component';

declare var X: any;

@Component({
  selector: 'b3n-consent-management',
  templateUrl: './consent-management.component.html',
  styleUrls: ['./consent-management.component.scss']
})
export class ConsentManagementComponent extends DestroySubscriberComponent implements OnInit {
  isLoading: boolean;
  loading: boolean;
  searchCtr = this.fb.control('');
  columns = ['destination', 'voiceStatus', 'faxStatus', 'smsStauts', 'lastModified', 'action'];
  ui = {
    paging: new Pageable(1, 10),
    backUpPrevious: <Consent[]>null,
    current: <Consent[]>[],
    backUpNext: <Consent[]>null
  };
  dataSource: MatTableDataSource<Consent> = new MatTableDataSource<Consent>();

  constructor(
    private consentServie: ConsentService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.searchCtr.valueChanges
      .pipe(debounceTime(300), startWith(''), takeUntil(this.destroySubscriber$))
      .subscribe(() => this.onFilterChanged());
  }

  trackTask(index: number, item: Consent): string {
    return item?.number;
  }

  reload() {
    this.onFilterChanged();
  }

  openExport() {
    this.dialog.open(ExportConsentComponent, {
      width: '400px'
    });
  }

  openCreateConsent() {
    this.dialog
      .open(AddConsentNumberComponent, {
        width: '400px'
      })
      .afterClosed()
      .subscribe((data: Consent) => {
        if (data) {
          this.onFilterChanged();
        }
      });
  }

  edit(consent: Consent) {
    this.dialog
      .open(AddConsentNumberComponent, {
        data: {
          consent: consent
        },
        width: '400px'
      })
      .afterClosed()
      .subscribe((data: Consent) => {
        if (data) {
          const findIndex = this.ui.current.findIndex(x => x.number === data.number);
          if (findIndex > -1) {
            this.ui.current[findIndex] = data;
            this.updateDataSource(this.ui.current);
          }
        }
      });
  }

  delete(consent: Consent) {
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: `400px`,
        data: {
          message: `Do you want to delete <strong>${consent.number}?</strong> nunmber`,
          title: `Delete number`
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.consentServie.delete(consent.number).subscribe(() => {
            this.ui.current = this.ui.current.filter(x => x.number !== consent.number);
            this.updateDataSource(this.ui.current);
            if (this.ui.current.length === 0) {
              this.onFilterChanged();
            }
          });
        }
      });
  }

  prevPage() {
    this.loading = true;
    this.ui.backUpNext = this.ui.current;
    this.ui.current = this.ui.backUpPrevious;
    this.ui.backUpPrevious = null;
    this.ui.paging.page--;
    this.loadMore(false);
    this.updateDataSource(this.ui.current);
  }

  nextPage() {
    this.loading = true;
    this.ui.backUpPrevious = this.ui.current;
    this.ui.current = this.ui.backUpNext;
    this.ui.backUpNext = null;
    this.ui.paging.page++;
    this.loadMore(true);
    this.updateDataSource(this.ui.current);
  }

  private loadMore(isNext: boolean) {
    const handlePage = Object.assign({}, this.ui.paging);
    handlePage.page = isNext ? handlePage.page + 1 : handlePage.page - 1;
    if (handlePage.page === 0) {
      this.loading = false;
      return;
    }

    this.consentServie
      .search(this.searchCtr.value, handlePage)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        histories => {
          if (isNext) {
            this.ui.backUpNext = histories.content;
          } else {
            this.ui.backUpPrevious = histories.content;
          }
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private onFilterChanged() {
    // reset paging
    this.ui.paging.page = 1;
    this.fetchDataGroup();
  }

  private fetchDataGroup() {
    const next = Object.assign({}, this.ui.paging);
    next.page++;
    this.loading = true;

    forkJoin([
      this.consentServie.search(this.searchCtr.value, this.ui.paging),
      this.consentServie.search(this.searchCtr.value, next)
    ])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(res => {
        this.ui.current = res[0].content;
        this.ui.backUpNext = res[1].content;
        this.updateDataSource(this.ui.current);
      });
  }

  private updateDataSource(data: Consent[]) {
    this.dataSource = new MatTableDataSource<Consent>(data);
  }
}
