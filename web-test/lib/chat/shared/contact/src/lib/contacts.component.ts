import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MeQuery as CCMeQuery } from '@b3networks/api/callcenter';
import { Contact, ContactQuery, ContactService } from '@b3networks/api/contact';
import { InboxesService } from '@b3networks/api/inbox';
import { IsdnNumberQuery } from '@b3networks/api/sim';
import { FindSubscriptionReq, SubscriptionQuery, SubscriptionService } from '@b3networks/api/subscription';
import {
  ChannelQuery,
  ChannelService,
  MeQuery,
  SCMetaDataQuery,
  SCMetaDataService,
  UserQuery,
  UserService
} from '@b3networks/api/workspace';
import { RIGHT_SIDEBAR_ID } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, ISDN_PRODUCT } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent extends DestroySubscriberComponent implements OnInit {
  readonly RIGHT_SIDEBAR_ID = RIGHT_SIDEBAR_ID;

  isViewingCase: boolean;
  contactActive$: Observable<Contact>;
  hasPermission: boolean;

  constructor(
    private meQuery: MeQuery,
    private contactQuery: ContactQuery,
    private contactService: ContactService,
    private meCallcenterQuery: CCMeQuery,
    private isdnNumberQuery: IsdnNumberQuery,
    private subscriptionQuery: SubscriptionQuery,
    private subscriptionService: SubscriptionService,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private userQuery: UserQuery,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private router: Router,
    private inboxesService: InboxesService,
    private scMetaDataQuery: SCMetaDataQuery,
    private scMetaDataService: SCMetaDataService
  ) {
    super();

    this.activatedRoute.params.pipe(takeUntil(this.destroySubscriber$)).subscribe(params => {
      const contactUuid = params['contactUuid'];
      // contactUuid param  => viewing case&txn module
      if (contactUuid) {
        this.contactService.updateRecentContactsActive(contactUuid);

        this.channelService.removeActive(this.channelQuery.getActiveId()); //  remove active channel
        this.userService.removeActive(this.userQuery.getActiveId()); //  remove active member

        // fetch info contact
        const isInboxFlow = this.router.url.includes('/txns/inboxes/');
        if (isInboxFlow) {
          this.inboxesService
            .getSingleContact(contactUuid)
            .pipe(map(x => new Contact(x)))
            .subscribe(contact => {
              this.contactService.updateContacts2Store([contact]);
              this.contactService.setActive(contactUuid);
            });
        } else {
          const contact = this.contactQuery.getEntity(contactUuid);
          if (!contact || contact.isTemporary) {
            this.contactService.getOne(contactUuid).subscribe(_ => {
              this.contactService.setActive(contactUuid);
            });
          } else {
            if (!contact.isNotExisted) {
              this.contactService.setActive(contactUuid);
            }
          }
        }
      }
    });
  }

  ngOnInit() {
    this.contactActive$ = this.contactQuery.selectActive().pipe(filter(x => x != null));

    if (!this.scMetaDataQuery.hasLoaded()) {
      this.scMetaDataService.getCaseMetadata().subscribe();
    }

    this.meQuery.me$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(me => me != null && !!me.identityUuid)
      )
      .subscribe(me => {
        this.subscriptionService
          .findSubscriptions(
            new FindSubscriptionReq({
              productIds: [ISDN_PRODUCT.id],
              assignee: me.uuid,
              embed: ['features']
            })
          )
          .subscribe();

        combineLatest([
          this.isdnNumberQuery.selectAssignedNumbers(me.identityUuid),
          this.subscriptionQuery.selectAll(),
          this.meCallcenterQuery.isPermission$
        ])
          .pipe(
            takeUntil(this.destroySubscriber$),
            filter(([numbers, subs, permission]) => numbers != null && subs != null && permission != null)
          )
          .subscribe(([numbers, subs, permission]) => {
            this.hasPermission = permission || numbers.length > 0;
          });
      });
  }
}
