import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BookingMeetingService, Meeting } from '@b3networks/api/booking';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { ManageConnectAccountComponent } from './manage-connect-account/manage-connect-account.component';

@Component({
  selector: 'b3n-meeting',
  templateUrl: './meeting.component.html',
  styleUrls: ['./meeting.component.scss']
})
export class BookingMeetingComponent extends DestroySubscriberComponent implements OnInit {
  meeting: Meeting;
  mettingRooms: KeyValue<string, string>[];
  updating = false;
  isLoading = true;

  readonly meetingDurationBreak: KeyValue<number, string>[] = [
    { key: 15, value: '15' },
    { key: 20, value: '20' },
    { key: 25, value: '25' },
    { key: 40, value: '40' },
    { key: 50, value: '50' },
    { key: 80, value: '80' },
    { key: 110, value: '110' }
  ];
  readonly meetingDurationNoBreak: KeyValue<number, string>[] = [
    { key: 15, value: '15' },
    { key: 20, value: '20' },
    { key: 30, value: '30' },
    { key: 45, value: '45' },
    { key: 60, value: '60' },
    { key: 90, value: '90' },
    { key: 120, value: '120' }
  ];

  constructor(
    private bookingMeetingService: BookingMeetingService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.bookingMeetingService
      .getMeetings()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(meeting => {
        this.meeting = meeting;
        this.convertDuration();
      });

    this.bookingMeetingService.getMeetingRooms().subscribe(rooms => {
      this.mettingRooms = Object.keys(rooms).map(r => {
        return { key: r, value: rooms[r] };
      });
    });
  }

  onUpdate() {
    this.updating = true;
    this.bookingMeetingService
      .updateMeeting(this.meeting)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.toastService.success('Apply successfully!');
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }

  convertDuration() {
    if (this.meeting.breaks) {
      if (!this.meetingDurationBreak.find(d => d.key === this.meeting.duration)) {
        let findindex = this.meetingDurationNoBreak.findIndex(d => d.key === this.meeting.duration);
        if (findindex) {
          this.meeting.duration = this.meetingDurationBreak[findindex].key;
        }
      }
    } else {
      if (!this.meetingDurationNoBreak.find(d => d.key === this.meeting.duration)) {
        let findindex = this.meetingDurationBreak.findIndex(d => d.key === this.meeting.duration);
        if (findindex) {
          this.meeting.duration = this.meetingDurationNoBreak[findindex].key;
        }
      }
    }
  }

  showManageAccount() {
    this.dialog.open(ManageConnectAccountComponent, {
      width: '400px',
      autoFocus: false
    });
  }
}
