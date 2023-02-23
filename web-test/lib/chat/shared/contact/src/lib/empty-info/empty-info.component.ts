import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Extension, StaffExtensionQuery } from '@b3networks/api/bizphone';
import { WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import { Contact, ContactQuery, ContactService } from '@b3networks/api/contact';
import { ChannelQuery, ChannelService, NetworkService, User, UserQuery } from '@b3networks/api/workspace';
import { DestroySubscriberComponent, LocalStorageUtil, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';

enum TypeContact {
  Contact = 'Contact',
  User = 'User'
}

@Component({
  selector: 'b3n-empty-info',
  templateUrl: './empty-info.component.html',
  styleUrls: ['./empty-info.component.scss']
})
export class EmptyInfoComponent extends DestroySubscriberComponent implements OnInit {
  type: TypeContact;
  user: User;
  contact: Contact;
  selectExtension$: Observable<Extension>;

  readonly TypeContact = TypeContact;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private contactQuery: ContactQuery,
    private contactService: ContactService,
    private userQuery: UserQuery,
    private toastService: ToastService,
    private webrtcQuery: WebrtcQuery,
    private webrtcService: WebrtcService,
    private networkService: NetworkService,
    private staffExtensionQuery: StaffExtensionQuery,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService
  ) {
    super();
  }
  ngOnInit(): void {
    this.userQuery
      .selectCount()
      .pipe(
        filter(n => n > 0),
        take(1)
      )
      .subscribe(_ => {
        this.activeRoute.params.subscribe(params => {
          if (params['uuid']) {
            LocalStorageUtil.setItem(`lastestView_v1_${X.orgUuid}`, encodeURIComponent(this.router.url));
            this.channelService.removeActive(this.channelQuery.getActiveId()); //  remove active channel
            const member = this.userQuery.getEntity(params['uuid']);
            if (member) {
              this.type = TypeContact.User;
              this.user = member;
              setTimeout(() => {
                this.selectExtension$ = this.staffExtensionQuery.selectExtByIdentity(this.user.identityUuid);
              });
            } else {
              this.type = TypeContact.Contact;
              this.contact = this.contactQuery.getEntity(params['uuid']);
              if (this.contact) {
                this.contactService.updateRecentContactsActive(params['uuid']);
              }
            }
          }
        });
      });
  }

  // only call with WebRTC
  makeCallTo(number: string, contact: User | Contact) {
    if (!this.webrtcQuery.UA?.isRegistered()) {
      this.toastService.error(
        'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
      );
      return;
    }

    if (this.webrtcQuery.isBusy) {
      this.toastService.error('You are on a call process.');
      return;
    }

    if (!this.networkService.isOnline) {
      this.toastService.warning(
        "Your computer seems to be offline. We'll keep trying to reconnect, or you can try refresh your browser",
        10e3
      );
      return;
    }

    this.webrtcService.makeCallOutgoing(number, contact);
  }
}
