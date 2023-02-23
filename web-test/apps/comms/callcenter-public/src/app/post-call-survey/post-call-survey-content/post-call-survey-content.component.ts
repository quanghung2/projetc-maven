import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { FeedbackInfoReq, FeedbackService, FeedbackTxnInfo } from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-post-call-survey-content',
  templateUrl: './post-call-survey-content.component.html',
  styleUrls: ['./post-call-survey-content.component.scss']
})
export class PostCallSurveyContentComponent implements AfterViewInit {
  constructor(private feedbackService: FeedbackService, private cdr: ChangeDetectorRef) {}

  @ViewChild('surveyContent', { read: ElementRef, static: true }) surveyContent: any;
  @Input() txnUuid: string;
  @Output() submitEvent: EventEmitter<FeedbackTxnInfo> = new EventEmitter<FeedbackTxnInfo>();

  isSending: boolean;
  minHeight: string;
  starSize: string;
  feedbackInfo: FeedbackInfoReq = {
    rate: 5,
    message: ''
  };

  ngAfterViewInit() {
    const frameWidth = this.surveyContent.nativeElement.getBoundingClientRect().width;
    this.starSize = `${frameWidth / 7 < 60 ? frameWidth / 7 : 60}px`;
    this.minHeight = `${this.surveyContent.nativeElement.getBoundingClientRect().height}px`;
    this.cdr.detectChanges();
  }

  submit() {
    this.isSending = true;
    this.feedbackService
      .sendFeedback(this.txnUuid, this.feedbackInfo, X.orgUuid)
      .pipe(
        finalize(() => {
          this.isSending = false;
        })
      )
      .subscribe(feedbackRes => {
        this.submitEvent.emit(feedbackRes as FeedbackTxnInfo);
      });
  }
}
