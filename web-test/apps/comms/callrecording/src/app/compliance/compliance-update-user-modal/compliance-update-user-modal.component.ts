import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Agent, AgentRole, ComplianceService, ModalMessage, ModalService } from '../../shared';
import { ComplianceModalComponent } from '../compliance-modal.component';

declare let jQuery: any;

@Component({
  selector: 'app-compliance-update-user-modal',
  templateUrl: './compliance-update-user-modal.component.html',
  styleUrls: ['./compliance-update-user-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ComplianceUpdateUserModalComponent implements OnInit {
  @ViewChild('dropdownRole') dropdownRole: ElementRef;

  @Input() agent: Agent;
  public errors: Array<string> = new Array<string>();
  public isLoading = false;
  public isEditing: boolean;
  public showing: boolean;

  constructor(private complianceService: ComplianceService, private modalService: ModalService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.isEditing = false;
    this.showing = false;
    if (this.agent && this.agent.uuid) {
      this.isEditing = true;
    }

    setTimeout(() => {
      this.showing = true;
    }, 100);

    jQuery(this.dropdownRole.nativeElement).dropdown({
      onChange: value => {
        this.agent.role = value;
      }
    });
  }

  updateMember(event) {
    this.errors = [];

    if (this.agent.givenName == undefined || this.agent.givenName.length == 0) {
      this.errors.push('Given name cannot be empty.');
      return false;
    }

    if (this.agent.familyName == undefined || this.agent.familyName.length == 0) {
      this.errors.push('Family name cannot be empty.');
      return false;
    }

    if (!this.isEditing && (this.agent.role == AgentRole.ADMIN || this.agent.role == AgentRole.MANAGER)) {
      if (this.agent.email == undefined || this.agent.email.length == 0) {
        this.errors.push('User with ADMIN/MANAGER role must provide email.');
        return false;
      }
    }

    if (this.agent.phoneNumber == undefined || this.agent.phoneNumber.length == 0) {
      this.errors.push('Phone number cannot be empty.');
      return false;
    }

    this.isLoading = true;

    let promise;
    if (this.agent.uuid == undefined) {
      promise = this.complianceService.addUser(this.agent);
    } else {
      promise = this.complianceService.setUser(this.agent);
    }

    promise
      .then((res: any) => {
        this.isLoading = false;
        if (res.uuid != undefined) {
          this.openComplianceModal();
        } else {
          this.errors.push(res.message);
        }
      })
      .catch(err => {
        this.isLoading = false;
        this.errors.push(err.message);
      });

    event.stopPropagation();
    event.preventDefault();
    return true;
  }

  openComplianceModal() {
    const message = new ModalMessage(ComplianceModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }
}
