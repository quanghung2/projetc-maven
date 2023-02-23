import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { BlacklistService } from 'libs/api/ivr/src/lib/blacklist/blacklist.service';
import { BlockedNumber } from 'libs/api/ivr/src/lib/blacklist/number-block';
import { finalize, switchMap } from 'rxjs/operators';
import { AddBlockNumberComponent } from './add-block-number/add-block-number.component';
import { DeleteBlockNumberComponent } from './delete-block-number/delete-block-number.component';

export interface DeleteBlockNumberDialogData {
  number: string;
  workFlowUuid: string;
}

@Component({
  selector: 'b3n-black-list',
  templateUrl: './black-list.component.html',
  styleUrls: ['./black-list.component.scss']
})
export class BlackListComponent implements OnInit {
  readonly displayedColumns: string[] = ['phonenumber', 'countryCode', 'createdAt', 'delete'];
  workflowUuid: string;
  blockedNumbers: BlockedNumber[];
  blockAnonymous = false;

  constructor(
    private route: ActivatedRoute,
    private blacklistService: BlacklistService,
    private dialog: MatDialog,
    private spinner: LoadingSpinnerSerivce,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.initBlockedNumbers();
  }

  initBlockedNumbers() {
    this.spinner.showSpinner();
    this.route.params
      .pipe(
        switchMap(params => {
          this.workflowUuid = params['uuid'];
          return this.blacklistService
            .fetchBlockedNumbers(this.workflowUuid)
            .pipe(finalize(() => this.spinner.hideSpinner()));
        })
      )
      .subscribe(
        data => {
          const anonymous = data.find(item => item.number == 'anonymous');
          if (anonymous) {
            this.blockAnonymous = true;
            const index = data.indexOf(anonymous);
            this.blockedNumbers = data;
            this.blockedNumbers.splice(index, 1);
          } else {
            this.blockedNumbers = data;
          }
        },
        err =>
          this.toastService.error('Unexpected error happened while fetching blocked number. Please try again later')
      );
  }

  openAddBlacklistNumberDialog() {
    this.dialog
      .open(AddBlockNumberComponent, {
        width: '450px',
        data: { uuid: this.workflowUuid }
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.initBlockedNumbers();
        }
      });
  }

  openDeleteNumberDialog(blockedNumber: BlockedNumber) {
    this.dialog
      .open(DeleteBlockNumberComponent, {
        width: '400px',
        data: blockedNumber
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.initBlockedNumbers();
        }
      });
  }

  toggleBlockAnonymous(evt: MatSlideToggleChange) {
    if (evt.checked) {
      this.blacklistService.addBlockNumber(this.workflowUuid, 'anonymous').subscribe(() => {
        this.initBlockedNumbers();
      });
    } else {
      this.blacklistService.deleteBlockedNumbers(this.workflowUuid, 'anonymous').subscribe(() => {
        this.initBlockedNumbers();
      });
    }
  }
}
