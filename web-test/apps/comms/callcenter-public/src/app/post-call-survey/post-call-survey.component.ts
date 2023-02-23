import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FeedbackService, FeedbackTxnInfo } from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-post-call-survey',
  templateUrl: './post-call-survey.component.html',
  styleUrls: ['./post-call-survey.component.scss']
})
export class PostCallSurveyComponent implements OnInit {
  constructor(
    private feedbackService: FeedbackService,
    private activatedRoute: ActivatedRoute,
    private spinner: LoadingSpinnerSerivce
  ) {}

  txnUuid: string;
  feedbackTxnInfo: FeedbackTxnInfo;
  isExistSurveyTxn: boolean;
  isChecking: boolean;

  ngOnInit() {
    this.txnUuid = this.activatedRoute.snapshot.queryParamMap.get('id');
    X.orgUuid = this.activatedRoute.snapshot.queryParamMap.get('orgUuid');
    this.isChecking = true;
    this.spinner.showSpinner();
    this.feedbackService
      .getTxnInfo(this.txnUuid, X.orgUuid)
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
          this.isChecking = false;
        })
      )
      .subscribe(
        result => {
          this.isExistSurveyTxn = true;
        },
        err => {
          this.isExistSurveyTxn = false;
        }
      );
  }
}
