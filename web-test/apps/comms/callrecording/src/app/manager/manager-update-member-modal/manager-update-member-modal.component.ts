import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Agent, ComplianceService } from '../../shared';

@Component({
  selector: 'app-manager-update-member-modal',
  templateUrl: './manager-update-member-modal.component.html',
  styleUrls: ['./manager-update-member-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ManagerUpdateMemberModalComponent implements OnInit {
  @Output() action = new EventEmitter<any>();
  public agent: Agent = new Agent();
  public errors: Array<string> = new Array<string>();
  public isLoading = false;

  constructor(private complianceService: ComplianceService) {}

  ngOnInit() {}

  onUpdate(event) {
    this.errors = [];

    // if (this.agent.givenName == undefined || this.agent.givenName.length == 0) {
    //   this.errors.push("Given name invalids");
    //   return false;
    // }

    // if (this.agent.familyName == undefined || this.agent.familyName.length == 0) {
    //   this.errors.push("Family name invalids");
    //   return false;
    // }

    if (this.agent.phoneNumber == undefined || this.agent.phoneNumber.length == 0) {
      this.errors.push('Phone number invalids');
      return false;
    }

    if (this.agent.callerId == undefined || this.agent.callerId.length == 0) {
      this.errors.push('Caller id invalids');
      return false;
    }

    this.isLoading = true;
    this.complianceService
      .setUser(this.agent)
      .then((res: any) => {
        this.isLoading = false;
        if (res.message != undefined) {
          this.errors.push(res.message);
          return;
        }

        this.action.next({ name: 'updated', agent: this.agent });
      })
      .catch(err => {
        this.isLoading = false;
        this.errors.push(err.message);
      });

    event.stopPropagation();
    event.preventDefault();
    return true;
  }
}
