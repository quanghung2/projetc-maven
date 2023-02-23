import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CallManagement, WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { UserQuery } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable, of } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { KeypadComponent } from '../keypad/keypad.component';

@Component({
  selector: 'b3n-manage-phone-dialog',
  templateUrl: './manage-phone-dialog.component.html',
  styleUrls: ['./manage-phone-dialog.component.scss']
})
export class ManagePhoneDialogComponent extends DestroySubscriberComponent implements OnInit {
  callManagement$: Observable<CallManagement>;
  displayMember: Observable<string>;
  displayStatus: string;
  displayMemberStr: string;
  displayMemberImg: string;
  displayMemberKey: string;
  call: CallManagement;

  constructor(
    private webrtcQuery: WebrtcQuery,
    private webrtcService: WebrtcService,
    private extensionQuery: ExtensionQuery,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ManagePhoneDialogComponent>,
    private userQuery: UserQuery
  ) {
    super();
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    this.callManagement$ = this.webrtcQuery.callManagement$.pipe(
      tap(call => {
        if (call) {
          this.displayMember = this.getDisplayMember(call);
          this.displayStatus = this.getDisplayStatus(call);
        }
      })
    );
    this.webrtcQuery.session$.pipe(takeUntil(this.destroySubscriber$)).subscribe(session => {
      if (!session) {
        this.dialogRef.close();
      }
    });
  }

  ended() {
    this.webrtcService.doRejectCall();
    this.dialogRef.close(true);
  }

  accept() {
    this.webrtcService.doAnswerIncoming();
  }

  toggleHold() {
    this.webrtcService.doToggleHold();
  }

  toggleMute() {
    this.webrtcService.doToggleMute();
  }

  dialpad() {
    this.dialog.open(KeypadComponent, {
      width: '320px',
      data: {
        isDTMF: true
      }
    });
  }

  zoomOut() {
    this.dialogRef.close(true);
    this.webrtcService.doZoom(true);
  }

  private getDisplayMember(call: CallManagement): Observable<string> {
    if (call.isRemote) {
      const remoteExtIdentity = this.webrtcQuery?.session?.remote_identity?.display_name;
      if (remoteExtIdentity) {
        if (remoteExtIdentity.length > 8) {
          // phone
          return of(remoteExtIdentity);
        } else {
          // ext
          return this.extensionQuery.selectEntity(remoteExtIdentity, 'displayText');
        }
      }
      return of(null);
    } else {
      let displayName = call?.member?.displayName;
      if (displayName) {
        const ext = this.extensionQuery.getExtensionByKey(call?.member?.displayName.replace('+', ''));
        if (ext) {
          displayName = `${ext.extLabel} (#${ext.extKey})`;
        }
      }
      return of(displayName);
    }
  }

  private getDisplayStatus(call: CallManagement) {
    return '';
  }
}
