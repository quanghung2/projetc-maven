import { Component, OnInit } from '@angular/core';
import { filter } from 'rxjs/operators';
import { BaseModalComponent } from '../../../shared/base-modal.component';
import { User } from '../../../shared/model';
import { Stream, StreamId, StreamService } from '../../../shared/service/stream.service';

@Component({
  selector: 'app-callerids-view-modal',
  templateUrl: './callerids-view-modal.component.html',
  styleUrls: ['./callerids-view-modal.component.css']
})
export class CalleridsViewModalComponent extends BaseModalComponent implements OnInit {
  public member: User;
  public modalId: string = '#callerids-view-modal';

  constructor(private streamService: StreamService) {
    super();
    this.member = new User();
  }

  ngOnInit() {
    this.subscriptions = [];

    const subscription = this.streamService
      .getStream()
      .pipe(filter(stream => stream.id == StreamId.SHOW_CALLERIDS_VIEW_MODAL))
      .subscribe((stream: Stream) => {
        this.member = stream.data.member;
        this.showModal(this.modalId);
      });

    this.subscriptions.push(subscription);
  }
}
