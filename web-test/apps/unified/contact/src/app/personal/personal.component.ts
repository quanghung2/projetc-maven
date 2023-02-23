import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PersonalWhitelist, PersonalWhitelistService } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, finalize } from 'rxjs/operators';
import {
  AddPersonalWhitelistComponent,
  AddPersonalWhitelistData
} from './add-personal-whitelist/add-personal-whitelist.component';

@Component({
  selector: 'b3n-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalComponent extends DestroySubscriberComponent implements OnInit {
  searchTextCtr = new FormControl();
  loading: boolean;
  whiteList: PersonalWhitelist[];
  isSearching: boolean;

  // readonly displayedColumnsResult = ['number', 'voice', 'sms', 'fax', 'action'];
  readonly displayedColumnsResult = ['number', 'voice', 'action'];
  constructor(
    private toastService: ToastService,
    private personalWhitelistService: PersonalWhitelistService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;
    this.personalWhitelistService
      .search('+')
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        data => {
          this.whiteList = data;
          this.isSearching = false;
        },
        err => this.toastService.error(err.message)
      );

    // clear text -> reload
    this.searchTextCtr.valueChanges.pipe(filter(x => !x)).subscribe(() => this.searchPrefix());
  }

  create() {
    this.dialog
      .open(AddPersonalWhitelistComponent, {
        data: <AddPersonalWhitelistData>{
          whitelist: null
        },
        width: '600px',
        maxHeight: '750px'
      })
      .afterClosed()
      .subscribe(prefix => {
        if (prefix) {
          this.searchPrefix();
        }
      });
  }

  edit(whitelist: PersonalWhitelist) {
    const dialogRef = this.dialog.open(AddPersonalWhitelistComponent, {
      data: <AddPersonalWhitelistData>{
        isCreate: false,
        whitelist: whitelist
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

  onDelete(item: PersonalWhitelist) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '50rem',
        data: <ConfirmDialogInput>{
          title: 'Delete number',
          message: `Are you sure you want to delete ${item.number}?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.personalWhitelistService.deleteNumber(item.number).subscribe(
            _ => {
              this.searchPrefix();
            },
            err => this.toastService.error(err.message)
          );
        }
      });
  }

  searchPrefix() {
    const number = !!this.searchTextCtr.value ? '+' + this.searchTextCtr.value : '+';
    this.loading = true;
    this.personalWhitelistService
      .search(number)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        data => {
          this.whiteList = data;
          this.isSearching = !!this.searchTextCtr.value;
        },
        err => this.toastService.error(err.message)
      );
  }
}
