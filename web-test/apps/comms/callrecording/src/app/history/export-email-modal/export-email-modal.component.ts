import { Component, OnDestroy, OnInit } from '@angular/core';
import { HistoryService } from '../../shared/service';
import { User } from '../../shared/model';

declare let X: any;

@Component({
  selector: 'app-export-email-modal',
  templateUrl: './export-email-modal.component.html',
  styleUrls: ['./export-email-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ExportEmailModalComponent implements OnInit {
  public email: string;
  public exporting: boolean;
  public params: any = {};
  public user = new User();

  constructor(private historyService: HistoryService) {}

  ngOnInit() {}

  export() {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.params.email = !!this.email ? this.email : this.user.email;
    this.historyService
      .exportCSV(this.params)
      .then((data: any) => {
        this.exporting = false;
        X.showSuccess(
          'Your export request is being processed. It may take several minutes to generated. Once completed, the csv file will be sent to you via email ' +
            this.email
        );
      })
      .catch(err => {
        console.error(err);
        this.exporting = false;
        X.showWarn(
          'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
        );
      });
  }
}
