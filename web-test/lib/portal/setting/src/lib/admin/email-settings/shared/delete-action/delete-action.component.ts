import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DeleteItemData, DeleteItemDialogComponent } from '../delete-item-dialog/delete-item-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'b3n-delete-action',
  templateUrl: './delete-action.component.html',
  styleUrls: ['./delete-action.component.scss']
})
export class DeleteActionComponent implements OnInit {
  @Input() displayText: string;
  @Input() key: string;
  @Output() deleteEvent: EventEmitter<boolean> = new EventEmitter();
  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  remove($event) {
    $event.stopPropagation();
    const dialogRef = this.dialog.open(DeleteItemDialogComponent, {
      width: '450px',
      data: <DeleteItemData>{
        key: this.key,
        displayText: this.displayText
      }
    });

    dialogRef.afterClosed().subscribe(isConfirm => {
      this.deleteEvent.emit(isConfirm);
    });
  }
}
