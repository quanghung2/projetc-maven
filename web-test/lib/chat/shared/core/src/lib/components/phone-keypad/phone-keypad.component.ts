import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import { DelegatedCallerId, ExtensionQuery, MeQuery as CCMeQuery } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Contact, ContactService } from '@b3networks/api/contact';
import { NetworkService, User } from '@b3networks/api/workspace';
import { DestroySubscriberComponent, normalize } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { ConvoHelperService } from '../../core/adapter/convo-helper.service';
import { ManagePhoneDialogComponent } from '../manage-phone-dialog/manage-phone-dialog.component';
import { PhoneDialogComponent } from '../phone-dialog/phone-dialog.component';

const DEFAULT_SIZE = 10;
const DEFAULT_TIMEOUT = 500;

interface ResultSearch<K> {
  result: K[];
  hasMore?: boolean;
}

@Component({
  selector: 'b3n-phone-keypad',
  templateUrl: './phone-keypad.component.html',
  styleUrls: ['./phone-keypad.component.scss']
})
export class PhoneKeypadComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  @ViewChild('inputDial') inputDial: ElementRef;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;

  delegatedCallerId$: Observable<DelegatedCallerId[]>;
  phoneNumber = this.fb.control('');
  calling: boolean;
  key: string;
  teams: ResultSearch<User> = {
    result: [],
    hasMore: false
  };

  contacts: ResultSearch<Contact> = {
    result: [],
    hasMore: false
  };
  extensionHasCallerId$: Observable<boolean>;

  @Input() callerId: string;

  constructor(
    private dialogRef: MatDialogRef<PhoneDialogComponent>,
    private fb: UntypedFormBuilder,
    private contactService: ContactService,
    private convoHelperService: ConvoHelperService,
    private networkService: NetworkService,
    private toastService: ToastService,
    private meCallcenterQuery: CCMeQuery,
    private extensionQuery: ExtensionQuery,
    private webrtcService: WebrtcService,
    private dialog: MatDialog,
    private webrtcQuery: WebrtcQuery,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    super();
  }

  ngOnInit() {
    this.delegatedCallerId$ = this.meCallcenterQuery.extensionKey$.pipe(
      filter(ext => !!ext),
      switchMap(extKey => this.extensionQuery.selectDelegatedCallerIdsForExt(extKey))
    );

    this.extensionHasCallerId$ = this.meCallcenterQuery.extensionHasCallerId$.pipe(filter(x => !!x));

    this.phoneNumber.valueChanges
      .pipe(debounceTime(DEFAULT_TIMEOUT), distinctUntilChanged())
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(value => {
        this.search(value);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputDial?.nativeElement?.focus();
    });
  }

  openMenu() {
    this.matMenuTrigger?.openMenu();
  }

  private highlight(key: string) {
    while (key.startsWith('@') || key.startsWith('#')) {
      key = key.substring(1);
    }
    key = key.trim();
    return normalize(key);
  }

  private search(querystring: string) {
    this.key = this.highlight(querystring).toLowerCase();
    if (!this.key) {
      this.teams.result = [];
      this.contacts.result = [];
      return;
    }

    const tms = this.convoHelperService.getAllUsersContainsAndMore(this.key, DEFAULT_SIZE);
    this.teams.result = tms.result.map(x => x.item);

    // @TODO
    // search include phone & email -- Cash
    this.contactService.search(this.key, new Pageable(1, DEFAULT_SIZE)).subscribe(res => {
      this.contacts.result = res;
    });
  }

  trackByTeam(team: User) {
    return team != null ? team.uuid : null;
  }

  trackByContact(contact: Contact) {
    return contact != null ? contact.uuid : null;
  }

  get currentPhoneValue() {
    return this.phoneNumber.value;
  }

  inputNumber(i: number | string) {
    this.phoneNumber.setValue(this.currentPhoneValue + i.toString());
    if (this.data?.isDTMF) {
      this.webrtcService.doDTMF(i);
    }
  }

  btnDelete() {
    this.phoneNumber.setValue(this.phoneNumber.value.slice(0, this.phoneNumber.value.length - 1));
  }

  async doTransfer() {
    this.webrtcService.doDTMF('#');
    this.phoneNumber.setValue(this.currentPhoneValue + '#');
    this.webrtcService.doDTMF('#');
    this.phoneNumber.setValue(this.currentPhoneValue + '#');
    this.webrtcService.doDTMF('2');
    this.phoneNumber.setValue(this.currentPhoneValue + '2');
  }

  doPress($event) {
    if (this.data?.isDTMF) {
      this.webrtcService.doDTMF($event.key);
    }
  }

  btnCall(callerId: string) {
    if (this.data?.isDTMF) {
      return;
    }
    this.webrtcService.updateUAConfiguration('display_name', callerId);
    this.makeCallTo(this.currentPhoneValue);
    this.dialog.closeAll();
    this.openManagePhoneDialog();
  }

  openManagePhoneDialog() {
    this.dialog.open(ManagePhoneDialogComponent, {
      data: {},
      width: '350px',
      height: '600px',
      panelClass: 'manage-call'
    });
  }

  makeCallTo(number: string) {
    if (!this.webrtcQuery.UA?.isRegistered()) {
      this.toastService.error(
        'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
      );
      return;
    }

    if (this.webrtcQuery.isBusy) {
      this.toastService.error('You are on a call process.');
      return;
    }

    if (!this.networkService.isOnline) {
      this.toastService.warning(
        "Your computer seems to be offline. We'll keep trying to reconnect, or you can try refresh your browser",
        10e3
      );
      return;
    }

    let text = number;
    if (text.startsWith('+')) {
      text = text.slice(1, text.length);
    }

    this.webrtcService.makeCallOutgoing(
      number,
      new Contact({
        displayName: `+${text}`
      })
    );
    this.dialogRef.close();
  }
}
