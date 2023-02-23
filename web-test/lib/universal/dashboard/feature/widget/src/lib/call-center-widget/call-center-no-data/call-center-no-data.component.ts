import { Component, Input, OnInit } from '@angular/core';
import { DashboardV2Service, QuestionV2 } from '@b3networks/api/dashboard';
import { HashMap } from '@datorama/akita';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-call-center-no-data',
  templateUrl: './call-center-no-data.component.html',
  styleUrls: ['./call-center-no-data.component.scss']
})
export class CallCenterNoDataComponent implements OnInit {
  @Input() questionV2: QuestionV2;

  questionErrorHash$$: Observable<HashMap<string>>;

  constructor(private dashboardV2Service: DashboardV2Service) {}

  ngOnInit() {
    this.questionErrorHash$$ = this.dashboardV2Service.questionErrorHash$$;
  }
}
