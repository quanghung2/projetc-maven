import { Component } from '@angular/core';
import { EventStreamService } from '../../shared';

@Component({
  selector: 'side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent {
  loading = true;
  currentAccount: any;

  constructor(private eventStreamService: EventStreamService) {
    this.eventStreamService.on('switch-account').subscribe(res => {
      this.loading = true;
    });

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });
  }

  private loadInfo(curAcc) {
    this.currentAccount = curAcc;
    this.loading = false;
  }
}
