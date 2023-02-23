import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { Extension, ExtensionBase, StaffExtensionQuery } from '@b3networks/api/bizphone';
import { WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import { DelegatedCallerId, ExtensionQuery, MeQuery as CCMeQuery } from '@b3networks/api/callcenter';
import { Contact } from '@b3networks/api/contact';
import { ChannelType, MeQuery, NetworkService, Privacy } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { filter, startWith, switchMap, tap } from 'rxjs/operators';
import { ManagePhoneDialogComponent } from '../manage-phone-dialog/manage-phone-dialog.component';

@Component({
  selector: 'b3n-phone-dialog',
  templateUrl: './phone-dialog.component.html',
  styleUrls: ['./phone-dialog.component.scss']
})
export class PhoneDialogComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  @ViewChild('inputDial') inputDial: ElementRef;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;

  readonly Privacy = Privacy;
  readonly ChannelType = ChannelType;

  extension$: Observable<Extension>;
  extensions$: Observable<ExtensionBase[]>;

  delegatedCallerId$: Observable<DelegatedCallerId[]>;
  extensionHasCallerId$: Observable<boolean>;

  phoneNumber = this.fb.control('');
  searchExtension = this.fb.control('');

  callerId: string;

  constructor(
    private meQuery: MeQuery,
    private staffExtensionQuery: StaffExtensionQuery,
    private dialogRef: MatDialogRef<PhoneDialogComponent>,
    private fb: UntypedFormBuilder,
    private networkService: NetworkService,
    private toastService: ToastService,
    private meCallcenterQuery: CCMeQuery,
    private extensionQuery: ExtensionQuery,
    private webrtcService: WebrtcService,
    private dialog: MatDialog,
    private webrtcQuery: WebrtcQuery
  ) {
    super();
  }

  ngOnInit() {
    this.extension$ = this.staffExtensionQuery.selectExtByIdentity(this.meQuery.getMe().identityUuid).pipe(
      tap(extension => {
        if (extension) {
          this.callerId = extension.callerId;
        }
      })
    );

    this.delegatedCallerId$ = this.meCallcenterQuery.extensionKey$.pipe(
      filter(ext => !!ext),
      switchMap(extKey => this.extensionQuery.selectDelegatedCallerIdsForExt(extKey))
    );

    this.extensions$ = this.searchExtension.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.extensionQuery.selectExtByText(value);
      })
    );

    this.extensionHasCallerId$ = this.meCallcenterQuery.extensionHasCallerId$.pipe(filter(x => !!x));
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputDial?.nativeElement?.focus();
    }, 200);
  }

  clearText() {
    const number = this.phoneNumber.value;
    this.phoneNumber.setValue(number.substr(0, number.length - 1));
  }

  doPress($event) {
    // if (this.data?.isDTMF) {
    //   this.webrtcService.doDTMF($event.key);
    // }
  }

  btnCall(callerId: string) {
    this.webrtcService.updateUAConfiguration('display_name', callerId);
    this.makeCallTo(this.currentPhoneValue);
    this.dialog.closeAll();
    this.openManagePhoneDialog();
  }

  btnCallExtension(extKey: string, callerId: string) {
    this.webrtcService.updateUAConfiguration('display_name', callerId);
    this.makeCallTo(extKey);
    this.dialog.closeAll();
    this.openManagePhoneDialog();
  }

  get currentPhoneValue() {
    return this.phoneNumber.value;
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

  openMenu() {
    this.matMenuTrigger?.openMenu();
  }

  inputPhoneNumber(i: number | string) {
    this.phoneNumber.setValue(this.currentPhoneValue + i.toString());
  }

  async doTransfer() {
    this.webrtcService.doDTMF('#');
    this.phoneNumber.setValue(this.currentPhoneValue + '#');
    this.webrtcService.doDTMF('#');
    this.phoneNumber.setValue(this.currentPhoneValue + '#');
    this.webrtcService.doDTMF('2');
    this.phoneNumber.setValue(this.currentPhoneValue + '2');
  }

  changePhoneNumber(phoneNumber: string) {
    this.phoneNumber.setValue(phoneNumber);
  }
}
