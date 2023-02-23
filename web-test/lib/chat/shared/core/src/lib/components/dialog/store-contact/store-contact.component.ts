import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Contact, ContactService, StoreContactReq, UserContactType } from '@b3networks/api/contact';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-store-contact',
  templateUrl: './store-contact.component.html',
  styleUrls: ['./store-contact.component.scss']
})
export class StoreContactComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  contact: Contact;
  noEmail: boolean;
  req = <StoreContactReq>{};
  progressing: boolean;
  numbers = new Set<string>();
  emails = new Set<string>();

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { contact: Contact; noEmail: boolean; isCompanyContact: boolean },
    private contactSerivce: ContactService,
    private dialogRef: MatDialogRef<StoreContactComponent>,
    private toastService: ToastService
  ) {
    this.contact = data?.contact || new Contact();
    this.noEmail = data?.noEmail;
  }

  ngOnInit() {
    if (this.contact.uuid) {
      this.req.displayName = this.contact.displayName;
      this.numbers = new Set<string>(this.contact.numbers?.map(n => n.number));
      this.emails = new Set<string>(this.contact.emails?.map(e => e.email));
    }
  }

  add(event: MatChipInputEvent, type: number) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      switch (type) {
        case 1:
          this.numbers.add(value);
          break;
        case 2:
          this.emails.add(value);
          break;
        default:
          break;
      }
    }

    if (input) {
      input.value = '';
    }
  }

  remove(item: string, type: number) {
    switch (type) {
      case 1:
        this.numbers.delete(item);
        break;
      case 2:
        this.emails.delete(item);
        break;
      default:
        break;
    }
  }

  create() {
    this.progressing = true;
    this.req.number = Array.from(this.numbers).toString();
    this.req.email = Array.from(this.emails).toString();
    this.req.type = UserContactType.customer;
    let api$;

    if (this.data?.isCompanyContact) {
      api$ = this.contactSerivce.createCompanyContact(this.req);
    } else {
      api$ = this.contactSerivce.create(this.req);
    }

    api$.pipe(finalize(() => (this.progressing = false))).subscribe(
      _ => {
        this.dialogRef.close(true);
        this.toastService.success(`Created contact successfully`);
      },
      error => {
        this.toastService.warning(error.message);
      }
    );
  }

  update() {
    this.progressing = true;
    this.req.number = Array.from(this.numbers).toString();
    this.req.email = Array.from(this.emails).toString();
    delete this.req?.type;

    let api$;
    if (this.data?.isCompanyContact) {
      api$ = this.contactSerivce.updateV2(this.contact.uuid, this.req);
    } else {
      api$ = this.contactSerivce.update(this.contact.uuid, this.req);
    }

    api$.pipe(finalize(() => (this.progressing = false))).subscribe(
      contact => {
        this.dialogRef.close(contact);
        this.toastService.success(`Updated contact successfully`);
      },
      error => {
        this.toastService.warning(error.message);
      }
    );
  }
}
