import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Extension } from '@b3networks/api/bizphone';
import { Contact } from '@b3networks/api/contact';
import { User } from '@b3networks/api/workspace';

export const CallWebRTC = 'CallWebRTC';

@Component({
  selector: 'b3n-select-contact',
  templateUrl: './select-contact.component.html',
  styleUrls: ['./select-contact.component.scss']
})
export class SelectContactComponent implements OnInit {
  readonly CallWebRTC = CallWebRTC;

  type: string;
  listPhone: string[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { contact: Contact | User; ext: Extension },
    private dialogRef: MatDialogRef<SelectContactComponent>
  ) {}

  ngOnInit() {
    this.type = this.data.contact instanceof Contact ? 'contact' : 'member';
    this.listPhone =
      this.data.contact instanceof Contact
        ? this.data.contact.numbers?.map(x => x.number)
        : this.data.contact.mobileNumber
        ? [this.data.contact.mobileNumber]
        : [];
  }

  submit(number: string) {
    this.dialogRef.close(number);
  }
}
