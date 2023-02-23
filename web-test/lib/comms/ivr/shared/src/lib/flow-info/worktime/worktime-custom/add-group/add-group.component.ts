import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupHolidays, GroupHolidaysService } from '@b3networks/api/leave';

@Component({
  selector: 'b3n-add-group',
  templateUrl: './add-group.component.html',
  styleUrls: ['./add-group.component.scss']
})
export class AddGroupComponent implements OnInit, AfterViewInit {
  name: string;
  @ViewChild('inputName') inputName: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<AddGroupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private groupHolidaysService: GroupHolidaysService
  ) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.inputName) {
        this.inputName.nativeElement.focus();
      }
    }, 300);
  }

  addGroup() {
    this.groupHolidaysService
      .createAndUpdateGroupHolidays(<GroupHolidays>{
        groupName: this.name,
        dates: []
      })
      .subscribe(res => {
        this.dialogRef.close(res);
      });
  }
}
