import { Injectable } from '@angular/core';
import { SuccessModalComponent } from './success.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(private dialog: MatDialog) {}

  openSuccessModal(text: string, width = '600px') {
    this.dialog.open(SuccessModalComponent, {
      width: width,
      data: text
    });
  }
}
