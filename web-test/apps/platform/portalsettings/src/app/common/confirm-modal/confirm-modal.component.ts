import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { AsyncSubject, Observable } from 'rxjs';
import { ConfirmModalService } from '../../core/services/confirm-modal.service';

declare const $;

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() hasCloseIcon = true;
  @Input() allowMultiple = false;

  modalElement = null;
  header: string;
  message: string;

  private resultSubject: AsyncSubject<boolean>;

  constructor(private root: ElementRef, private confirmModalService: ConfirmModalService) {}

  ngOnInit() {
    this.confirmModalService.registerModal(this);
  }

  ngAfterViewInit() {
    this.modalElement = $(this.root.nativeElement).find('div.modal');
    this.modalElement.modal({
      allowMultiple: this.allowMultiple,
      observeChanges: true,
      closable: false,
      onApprove: () => {
        this.resultSubject.next(true);
        this.resultSubject.complete();
        return true;
      },
      onDeny: () => {
        this.resultSubject.next(false);
        this.resultSubject.complete();
        return true;
      }
    });
  }

  ngOnDestroy() {
    this.confirmModalService.unregisterModal();
    this.modalElement.remove();
  }

  show(config: ConfirmModalConfig): Observable<boolean> {
    this.header = config.header || 'Confirm';
    this.message = config.message;
    this.resultSubject = new AsyncSubject();

    this.showModal();

    return this.resultSubject;
  }

  private showModal() {
    this.modalElement.modal('show');
  }
}

export interface ConfirmModalConfig {
  header: string;
  message: string;
}
