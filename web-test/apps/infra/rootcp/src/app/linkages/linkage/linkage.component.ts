import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PartnersService } from '@b3networks/api/partner';
import { Linkage, LinkageService } from '@b3networks/api/store';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { StoreLinkageComponent } from '../store/store-linkage/store-linkage.component';

@Component({
  selector: 'b3n-linkage',
  templateUrl: './linkage.component.html',
  styleUrls: ['./linkage.component.scss']
})
export class LinkageComponent implements OnInit {
  linkageDisplayColumns: string[] = [
    'id',
    'buyerUuid',
    'sellerUuid',
    'createdDate',
    'defaultCurrency',
    'type',
    'actions'
  ];
  form: UntypedFormGroup;
  linkageDataSource: MatTableDataSource<Linkage>;
  linkageSearching: boolean;

  constructor(
    public dialog: MatDialog,
    private linkageService: LinkageService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private partnersService: PartnersService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.partnersService.getAllPartners().subscribe();
  }

  openStoreLinkageDialog(linkage?: Linkage): void {
    const { buyerUuid, sellerUuid } = this.form.controls;
    let subLinkage: Linkage;

    if (!linkage) {
      subLinkage = new Linkage({
        buyerUuid: buyerUuid.value,
        sellerUuid: sellerUuid.value
      });
    }

    this.dialog
      .open(StoreLinkageComponent, {
        width: '500px',
        data: {
          linkage,
          subLinkage
        },
        autoFocus: false,
        disableClose: true
      })
      .afterClosed()
      .subscribe(storedLinkage => {
        if (storedLinkage) {
          this.linkageDataSource = new MatTableDataSource([storedLinkage]);
        }
      });
  }

  initForm() {
    this.form = this.fb.group({
      buyerUuid: ['', Validators.required],
      sellerUuid: ['', Validators.required]
    });
  }

  searchLinkage() {
    this.linkageSearching = true;
    this.linkageService
      .getLinkage(this.form.value)
      .pipe(
        tap(linkage => {
          this.linkageDataSource = new MatTableDataSource([linkage]);
        }),
        catchError(err => {
          this.toastService.warning(err.message);
          return throwError(err);
        }),
        finalize(() => (this.linkageSearching = false))
      )
      .subscribe();
  }

  deleteLinkage(linkage: Linkage) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '600px',
        data: <ConfirmDialogInput>{
          title: 'Delete',
          message: `Do you want to delete this linkage?`,
          cancelLabel: 'Cannel',
          confirmLabel: 'Delete',
          color: 'warn'
        },
        autoFocus: false
      })
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          this.linkageService.deleteLinkage(linkage).subscribe(
            _ => {
              this.linkageDataSource = null;
              this.toastService.success(`Delete successfully`);
            },
            err => this.toastService.warning(err.message)
          );
        }
      });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }
}
