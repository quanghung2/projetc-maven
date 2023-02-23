import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'psh-step-fail',
  templateUrl: './step-fail.component.html',
  styleUrls: ['./step-fail.component.scss']
})
export class StepFailComponent {
  msg: string;
  @Input() goBackUrl: string;
  constructor(private router: Router) {
    this.msg = this.router.getCurrentNavigation().extras.state['msg'];
  }

  goBack() {
    if (this.goBackUrl) {
      document.location.href = this.goBackUrl;
    } else {
      this.router.navigate(['']);
    }
  }
}
