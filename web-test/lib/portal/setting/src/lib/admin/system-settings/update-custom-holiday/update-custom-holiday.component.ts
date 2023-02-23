import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ScheduleService, ScheduleUW } from '@b3networks/api/callcenter';
import { Dates, GroupHolidays, GroupHolidaysService, ReqGetGroupHolidays } from '@b3networks/api/leave';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, subDays } from 'date-fns';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

export interface UpdateCustomHolidayData {
  scheduleOrg: ScheduleUW;
}

@Component({
  selector: 'b3n-update-custom-holiday',
  templateUrl: './update-custom-holiday.component.html',
  styleUrls: ['./update-custom-holiday.component.scss']
})
export class UpdateCustomHolidayComponent implements OnInit {
  updating: boolean;
  groups: GroupHolidays[] = [];
  selectedGroup: GroupHolidays;
  loading: boolean;
  minDate = subDays(new Date(), 1);
  dateInput: string;
  enableHoliday: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: UpdateCustomHolidayData,
    private dialogRef: MatDialogRef<UpdateCustomHolidayComponent>,
    private groupHolidaysService: GroupHolidaysService,
    private scheduleService: ScheduleService,
    private toastr: ToastService
  ) {
    this.enableHoliday = !!this.data.scheduleOrg?.groupHolidayUuid;
  }

  ngOnInit(): void {
    this.loading = true;
    this.fetchGroup();
  }

  remove(date: string) {
    this.groupHolidaysService
      .createAndUpdateGroupHolidays(<GroupHolidays>{
        ...this.selectedGroup,
        dates: this.selectedGroup.dates.filter(x => x.date !== date)
      })
      .subscribe(group => {
        this.selectedGroup = group;
        const findIndex = this.groups.findIndex(x => x.groupUuid === group.groupUuid);
        this.groups[findIndex] = group;
        this.dateInput = null;
      });
  }

  addHoliday($event) {
    let date: string = $event.value;
    if (date) {
      date = format(new Date(date), 'yyyy-MM-dd');
      const hasDate = this.selectedGroup.dates.some(item => item.date === date);
      if (!hasDate) {
        this.groupHolidaysService
          .createAndUpdateGroupHolidays(<GroupHolidays>{
            ...this.selectedGroup,
            dates: [
              <Dates>{
                date: date,
                name: null
              },
              ...this.selectedGroup.dates
            ]
          })
          .subscribe(group => {
            this.selectedGroup = group;
            const findIndex = this.groups.findIndex(x => x.groupUuid === group.groupUuid);
            this.groups[findIndex] = group;
            this.dateInput = null;
          });
      }
    }
  }

  update() {
    this.scheduleService
      .updateScheduleOrg(<ScheduleUW>{
        groupHolidayUuid: this.enableHoliday ? this.selectedGroup.groupUuid : null
      })
      .subscribe(_ => {
        this.toastr.success('Config custom holiday has been updated');
        this.dialogRef.close(true);
      });
  }

  private fetchGroup() {
    this.groupHolidaysService
      .getGroupHolidays(<ReqGetGroupHolidays>{
        groupUuid: null
      })
      .pipe(
        switchMap(groups => {
          this.groups = groups;
          if (groups?.length > 0) {
            return of(this.groups[0]);
          }
          return this.groupHolidaysService.createAndUpdateGroupHolidays(<GroupHolidays>{
            groupName: 'Default',
            dates: []
          });
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(group => {
        this.selectedGroup = group;
      });
  }
}
