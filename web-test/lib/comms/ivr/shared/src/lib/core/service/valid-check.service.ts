import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ValidCheckService {
  private isInvalidStransferFormSource = new Subject<boolean>();
  private isInvalidConditionBlockSource = new Subject<boolean>();
  private isMultiplePopupOpeningSource = new Subject<boolean>();

  isInvalidStransferForm$ = this.isInvalidStransferFormSource.asObservable();
  isInvalidConditionBlock$ = this.isInvalidConditionBlockSource.asObservable();
  isMultiplePopupOpening$ = this.isMultiplePopupOpeningSource.asObservable();

  setInvalidTransferForm(isInvalid: boolean) {
    this.isInvalidStransferFormSource.next(isInvalid);
  }

  checkInvalidConditionBlock(startWithList: string[]) {
    startWithList.length > 0
      ? this.isInvalidConditionBlockSource.next(false)
      : this.isInvalidConditionBlockSource.next(true);
  }

  isMultiplePopupOpening(isOpening: boolean) {
    this.isMultiplePopupOpeningSource.next(isOpening);
  }
}
