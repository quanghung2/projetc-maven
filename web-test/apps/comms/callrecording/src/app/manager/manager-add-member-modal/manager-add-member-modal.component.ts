import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { Agent, ComplianceService } from '../../shared';

@Component({
  selector: 'app-manager-add-member-modal',
  templateUrl: './manager-add-member-modal.component.html',
  styleUrls: ['./manager-add-member-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ManagerAddMemberModalComponent implements OnInit {
  @Output() action = new EventEmitter<any>();
  public agent: Agent = new Agent();
  public errors: Array<string> = new Array<string>();
  public isLoading = false;

  constructor(private complianceService: ComplianceService) {}

  ngOnInit() {}

  addMember(event) {
    this.errors = [];

    if (this.agent.givenName == undefined || this.agent.givenName.length == 0) {
      this.errors.push('Given name invalids');
      return false;
    }

    if (this.agent.familyName == undefined || this.agent.familyName.length == 0) {
      this.errors.push('Family name invalids');
      return false;
    }

    if (this.agent.callerId == undefined || this.agent.callerId.length == 0) {
      this.errors.push('Phone number invalids');
      return false;
    }

    this.isLoading = true;
    this.complianceService.addUser(this.agent).then((res: any) => {
      if (res.uuid != undefined) {
        ModalComponent.on('close');
        this.action.emit({ name: 'add', agent: res });
      } else {
        this.errors.push(res.message);
      }
      this.isLoading = false;
    });

    event.stopPropagation();
    event.preventDefault();
    return true;
  }
}
