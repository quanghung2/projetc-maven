import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { OrgConsent, OrgConsentService, StatusConsent } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, finalize, take } from 'rxjs/operators';
import { StoreContactComponent, StoreContactData } from './store-contact/store-contact.component';

@Component({
  selector: 'b3n-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent extends DestroySubscriberComponent implements OnInit {
  orgConsents: OrgConsent[] = [];
  searchTextCtr = new FormControl();
  loading: boolean;
  isSearching: boolean;

  // readonly displayedColumnsResult = ['number', 'voice', 'sms', 'fax', 'last-modified', 'action'];
  readonly displayedColumnsResult = ['number', 'voice', 'last-modified', 'action'];
  readonly StatusConsent = StatusConsent;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private toastService: ToastService,
    private orgConsentService: OrgConsentService,
    private dialog: MatDialog,
    private identityProfileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.loading = true;
    this.identityProfileQuery.profile$
      .pipe(
        filter(x => !!x),
        take(1)
      )
      .subscribe(() => {
        this.orgConsentService
          .search('+')
          .pipe(finalize(() => (this.loading = false)))
          .subscribe(
            data => {
              this.orgConsents = data?.sort((a, b) => b.updated - a.updated);
              this.isSearching = false;
            },
            err => this.toastService.error(err.message)
          );
      });

    // clear text -> reload
    this.searchTextCtr.valueChanges.pipe(filter(x => !x)).subscribe(() => this.searchPrefix());
  }

  create() {
    const dialogRef = this.dialog.open(StoreContactComponent, {
      data: <StoreContactData>{
        isCreate: true
      },
      width: '600px',
      maxHeight: '750px'
    });
    dialogRef.afterClosed().subscribe(prefix => {
      if (prefix) {
        this.searchPrefix();
      }
    });
  }

  edit(orgConsent: OrgConsent) {
    const dialogRef = this.dialog.open(StoreContactComponent, {
      data: <StoreContactData>{
        isCreate: false,
        orgConsent: orgConsent
      },
      width: '600px',
      maxHeight: '750px'
    });
    dialogRef.afterClosed().subscribe(prefix => {
      if (prefix) {
        this.searchPrefix();
      }
    });
  }

  deleteConsent(consent: OrgConsent) {
    this.orgConsentService.delete(consent.number).subscribe(
      _ => {
        this.searchPrefix();
      },
      err => this.toastService.error(err.message)
    );
  }

  searchPrefix() {
    this.loading = true;
    const number = !!this.searchTextCtr.value ? '+' + this.searchTextCtr.value : '+';
    this.orgConsentService
      .search(number)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        data => {
          this.orgConsents = data?.sort((a, b) => b.updated - a.updated);
          this.isSearching = !!this.searchTextCtr.value;
        },
        err => this.toastService.error(err.message)
      );
  }
}
