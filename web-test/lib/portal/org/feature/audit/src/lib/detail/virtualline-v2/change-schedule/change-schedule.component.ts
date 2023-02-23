import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChangeSchedule } from '@b3networks/api/audit';
import { ChangeSchduleModalComponent } from './change-schdule-modal/change-schdule-modal.component';

@Component({
  selector: 'poa-change-schedule',
  templateUrl: './change-schedule.component.html',
  styleUrls: ['./change-schedule.component.scss']
})
export class ChangeScheduleComponent implements OnInit {
  columns = ['ipaddress', 'ipaddressValue', 'change', 'changeValue'];
  @Input('raw') raw: any;
  audit: ChangeSchedule;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.audit = new ChangeSchedule();
    if (this.raw.clientInfo) {
      this.audit.ipAddress = this.raw.clientInfo.ipAddress;
    }
    this.audit.shifts = this.raw.auditData.shifts || [];
    for (let shift of this.audit.shifts) {
      if (!shift.timeRanges || shift.timeRanges.length == 0) {
        shift.timeRangesStr = '-';
        continue;
      }

      let from0 = !shift.timeRanges[0] || !shift.timeRanges[0].from ? '' : shift.timeRanges[0].from;
      let to0 = !shift.timeRanges[0] || !shift.timeRanges[0].to ? '' : shift.timeRanges[0].to;
      let from1 = !shift.timeRanges[1] || !shift.timeRanges[1].from ? '' : shift.timeRanges[1].from;
      let to1 = !shift.timeRanges[1] || !shift.timeRanges[1].to ? '' : shift.timeRanges[1].to;

      if (from0 && to0 && from1 && to1) {
        shift.timeRangesStr = `${from0} - ${to0} and ${from1} - ${to1}`;
      } else if (from0 && to0) {
        shift.timeRangesStr = `${from0} - ${to0}`;
      } else if (from1 && to1) {
        shift.timeRangesStr = `${from1} - ${to1}`;
      }
    }
  }

  showModelDetail() {
    const data = {
      shifts: this.audit.shifts
    };
    this.dialog.open(ChangeSchduleModalComponent, {
      width: '750px',
      data
    });
  }
}
