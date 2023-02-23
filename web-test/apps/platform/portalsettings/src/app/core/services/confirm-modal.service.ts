import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ConfirmModalComponent } from './../../common/confirm-modal/confirm-modal.component';

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  private confirmModal: ConfirmModalComponent;

  registerModal(confirmModal: ConfirmModalComponent) {
    this.confirmModal = confirmModal;
  }

  unregisterModal() {
    this.confirmModal = null;
  }

  showConfirmModal(config): Observable<boolean> {
    if (!!this.confirmModal) {
      return this.confirmModal.show(config);
    }

    return throwError('No confirm modal has been registered!');
  }
}
