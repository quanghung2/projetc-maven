import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-edit-action-name',
  templateUrl: './edit-action-name.component.html',
  styleUrls: ['./edit-action-name.component.scss']
})
export class EditActionNameComponent implements OnInit {
  @Input() icon: string;
  @Input() number: number;
  @Input() name: string;
  @Input() allowEdit: boolean;
  @Output() editing = new EventEmitter<boolean>();
  @Output() setName = new EventEmitter<string>();
  @ViewChild('txtName') txtName: ElementRef;

  editingName: boolean;
  nameCtrl: UntypedFormControl;
  getErrorName = () => Utils.getErrorInput(this.nameCtrl);

  constructor() {}

  ngOnInit() {
    this.nameCtrl = new UntypedFormControl(
      this.name,
      Utils.validateInput({
        required: true,
        dataType: 'string',
        maxlength: ValidateStringMaxLength.NAME_TITLE
      })
    );
  }

  edit() {
    if (this.allowEdit) {
      this.editingName = true;
      this.editing.emit(true);
      setTimeout(() => {
        this.txtName.nativeElement.focus();
      });
    }
  }

  save() {
    if (this.nameCtrl.valid) {
      this.editingName = false;
      this.editing.emit(false);
      this.setName.emit(this.nameCtrl.value);
    } else {
      this.editing.emit(true);
    }
  }
}
