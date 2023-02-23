import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import { Contact } from '@b3networks/api/contact';
import { Meeting, MeetingQuery, MeetingService } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-conference-room',
  templateUrl: './conference-room.component.html',
  styleUrls: ['./conference-room.component.scss']
})
export class ConferenceRoomComponent extends DestroySubscriberComponent implements OnInit {
  readonly maxMemberShow = 8;

  meetings: Meeting[];
  calling: boolean = false;
  IdentityUUid: string;
  isLoading: boolean = true;

  constructor(
    private meetingService: MeetingService,
    private meetingQuery: MeetingQuery,
    private webrtcService: WebrtcService,
    private identityProfileQuery: IdentityProfileQuery,
    private webrtcQuery: WebrtcQuery,
    private dialog: MatDialog,

    private toastr: ToastService,
    public dialogRef: MatDialogRef<ConferenceRoomComponent>
  ) {
    super();
  }

  ngOnInit() {
    this.IdentityUUid = this.identityProfileQuery.getProfile().uuid;
    this.meetingQuery.meetings$.pipe(takeUntil(this.destroySubscriber$)).subscribe(
      meetings => {
        this.meetings = meetings;
        this.isLoading = false;
      },
      err => {
        this.toastr.error(err.message);
        this.isLoading = false;
      }
    );

    // this.getConferenceRoom();
    this.webrtcQuery.session$.pipe(takeUntil(this.destroySubscriber$)).subscribe(s => {
      this.calling = s ? true : false;
    });
    this.meetingService.getMeetings().subscribe();
  }

  createRoom() {
    this.isLoading = true;
    this.meetingService.createMeeting().subscribe(room => {
      this.toastr.success('A meeting is created. Room number is ' + room.conferenceRoomNumber);
      setTimeout(() => {
        this.joinMeeting(room.conferenceRoomNumber.toString());
      }, 100);
    });
  }

  joinMeeting(number: string) {
    let text = number;
    if (text.startsWith('+')) {
      text = text.slice(1, text.length);
    }

    this.webrtcService.makeCallOutgoing(
      number,
      new Contact({
        displayName: `+${text}`
      }),
      true
    );
  }

  confirmDelete(id: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Delete Room',
          message: `Are you want to delete this room?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          this.deleteRoom(id);
        }
      });
  }

  deleteRoom(id: number) {
    this.isLoading = true;
    this.meetingService.deleteMeeting(id).subscribe(a => {
      this.toastr.success('Delete successfully');
    });
  }

  checkJoinMeeting(meeting: Meeting) {
    this.meetingService.checkJoinMeeting(meeting.id).subscribe(
      _ => {
        this.joinMeeting(meeting.conferenceRoomNumber);
      },
      err => {
        this.toastr.error(err.message);
      }
    );
  }
}
