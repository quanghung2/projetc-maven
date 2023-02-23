import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Question, QuestionService } from '@b3networks/api/dashboard';
import { StoreQuestionComponent } from '../shared/store-question/store-question.component';

@Component({
  selector: 'b3n-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss']
})
export class QuestionComponent implements OnInit {
  displayedColumns: string[] = ['name', 'lastUpdated'];
  dataSource: MatTableDataSource<Question>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private questionService: QuestionService, private dialog: MatDialog) {}

  ngOnInit() {
    // this.questionService.fetchAll().subscribe(dashboards => {
    //   this.dataSource = new MatTableDataSource<Question>(dashboards);
    //   this.dataSource.paginator = this.paginator;
    // });
  }

  create() {
    this.dialog
      .open(StoreQuestionComponent, {
        width: '560px',
        data: null
      })
      .afterClosed()
      .subscribe(question => {
        if (question) {
          this.reload();
        }
      });
  }

  reload() {
    // this.questionService.fetchAll().subscribe(questions => {
    //   this.dataSource = new MatTableDataSource<Question>(questions);
    //   this.dataSource.paginator = this.paginator;
    // });
  }
}
