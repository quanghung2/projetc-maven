import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Card, CardConfig, CardService, DashboardType, Question, QuestionService } from '@b3networks/api/dashboard';
import { finalize } from 'rxjs/operators';

export interface AddCardReq {
  dashboardUuid: string;
  cardConfig: CardConfig;
  service: DashboardType;
}

@Component({
  selector: 'b3n-add-card',
  templateUrl: './add-card.component.html',
  styleUrls: ['./add-card.component.scss']
})
export class AddCardComponent implements OnInit {
  questions: Question[];
  selectedQuestion: Question;

  progressing: boolean;

  constructor(
    private dialogRef: MatDialogRef<AddCardComponent>,
    @Inject(MAT_DIALOG_DATA) private addCardReq: AddCardReq,
    private questionService: QuestionService,
    private cardService: CardService
  ) {}

  ngOnInit() {
    this.questionService.fetchAll(this.addCardReq.service).subscribe(questions => {
      this.questions = questions.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  progress() {
    this.progressing = true;
    const card = new Card();
    card.questionUuid = this.selectedQuestion.uuid;
    card.name = this.selectedQuestion.name;
    card.config = this.addCardReq.cardConfig;
    // card.config.cols = 1;
    // card.config.rows = 1;

    this.cardService
      .create(this.addCardReq.dashboardUuid, card)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(result => {
        this.dialogRef.close(result);
      });
  }
}
