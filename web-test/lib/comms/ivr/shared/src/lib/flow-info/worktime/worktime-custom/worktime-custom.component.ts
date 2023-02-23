import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Workflow } from '@b3networks/api/ivr';
import { Dates, GroupHolidays, GroupHolidaysService, ReqGetGroupHolidays } from '@b3networks/api/leave';
import { format, subDays } from 'date-fns';
import { finalize } from 'rxjs/operators';
import { AddGroupComponent } from './add-group/add-group.component';

@Component({
  selector: 'b3n-worktime-custom',
  templateUrl: './worktime-custom.component.html',
  styleUrls: ['./worktime-custom.component.scss']
})
export class WorktimeCustomComponent implements OnInit {
  @Input() workflow: Workflow;

  groups: GroupHolidays[] = [];
  selectedGroup: GroupHolidays;
  loading: boolean;
  minDate = subDays(new Date(), 1);
  dateInput: string;

  constructor(private groupHolidaysService: GroupHolidaysService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loading = true;
    this.fetchGroup(() => {
      this.selectedGroup = this.groups.find(x => x.groupUuid === this.workflow.rule?.groupHolidayUuid);
    });
  }

  selectGroupChange($event: GroupHolidays) {
    this.workflow.rule.groupHolidayUuid = $event?.groupUuid;
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

  addGroup() {
    this.dialog
      .open(AddGroupComponent, {
        width: '300px'
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.fetchGroup();
        }
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

  private fetchGroup(cb?: Function) {
    this.groupHolidaysService
      .getGroupHolidays(<ReqGetGroupHolidays>{
        groupUuid: null
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(groups => {
        this.groups = groups;
        cb();
      });
  }
}
