import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ConfirmModalService } from './confirm-modal.service';

@Injectable({ providedIn: 'root' })
export class ConfirmDeactivateService implements CanDeactivate<any> {
  constructor(private confirmModalService: ConfirmModalService) {}

  canDeactivate(target: any) {
    if (!!target.hasChanges && target.hasChanges()) {
      return this.confirmModalService.showConfirmModal({
        header: 'Leave?',
        message: `You haven't saved your changes yet. Do you want to leave without saving?`
      });
    }

    return true;
  }
}
