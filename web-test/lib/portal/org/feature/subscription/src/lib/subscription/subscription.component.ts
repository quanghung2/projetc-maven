import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  GetMembersReq,
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  Member,
  OrganizationPolicyQuery,
  OrgMemberService,
  RealDomainService
} from '@b3networks/api/auth';
import { GetAllProductReq, Product, ProductService } from '@b3networks/api/store';
import { GetSubscribedProductReq, SubscribedProductService } from '@b3networks/api/subscription';
import { DestroySubscriberComponent, MessageConstants, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { filter, mergeMap, takeUntil } from 'rxjs/operators';
import { SubscriptionDetailComponent } from '../subscription-detail/subscription-detail.component';
import { SubscriptionListComponent } from '../subscription-list/subscription-list.component';

@Component({
  selector: 'pos-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('subscriptionDetail') detailSubscription: SubscriptionDetailComponent;
  @ViewChild('subscriptionList') listSubscription: SubscriptionListComponent;
  showFilterToolbar: boolean;
  status = 'ACTIVE';

  loadingProduct = false;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  productCtrl = new UntypedFormControl();
  productFilterCtrl = new UntypedFormControl();
  productId = '';

  loadingMember = false;
  members: Member[] = [];
  filteredMembers: Member[] = [];
  memberCtrl = new UntypedFormControl();
  memberFilterCtrl = new UntypedFormControl();
  memberUuid = '';

  constructor(
    private toastr: ToastService,
    private productService: ProductService,
    private subscribedProductService: SubscribedProductService,
    private orgMemberService: OrgMemberService,
    private realDomainService: RealDomainService,
    private organizationPolicyQuery: OrganizationPolicyQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.organizationPolicyQuery
      .selectGrantedIAM(X.orgUuid, IAM_SERVICES.ui, IAM_UI_ACTIONS.show_subscription_column)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(iam => iam != null)
      )
      .subscribe(iam => {
        if (!iam.isAllowedAllResources && iam.resources.length > 0) {
          this.showFilterToolbar = true;
        }
      });

    this.getListProduct();
    this.productFilterCtrl.valueChanges.subscribe((val: string) => {
      this.filteredProducts = this.products.filter(p => p.name.toLowerCase().indexOf(val.toLowerCase()) >= 0);
    });
    this.productCtrl.valueChanges.subscribe((val: Product) => {
      this.productId = val.productId;
    });

    this.getListMember();
    this.memberFilterCtrl.valueChanges.subscribe((val: string) => {
      this.filteredMembers = this.members.filter(m => m.displayName.toLowerCase().indexOf(val.toLowerCase()) >= 0);
    });
    this.memberCtrl.valueChanges.subscribe((val: Member) => {
      this.memberUuid = val.uuid;
    });
  }

  // For dropdown status
  onStatusChange() {
    this.productId = '';
    this.memberUuid = '';
    this.getListProduct();
  }

  // For dropdown product
  getListProduct() {
    this.loadingProduct = true;

    const request: GetAllProductReq = {
      includeDescription: false
    };

    this.realDomainService
      .getRealDomainFromPortalDomain()
      .pipe(
        mergeMap(domain =>
          forkJoin([
            this.productService.getAllProduct(domain.domain, request),
            this.subscribedProductService.getSubscribedProducts(<GetSubscribedProductReq>{
              includeAll: true,
              subscriptionStatus: this.status
            })
          ])
        )
      )
      .subscribe(
        ([products, subscribedProducts]) => {
          this.loadingProduct = false;
          this.products = products.filter(p => subscribedProducts.products.includes(p.productId));
          const allProduct = new Product({ name: `All Products (${this.products.length})`, productId: '' });
          this.products = [allProduct, ...this.products];
          this.filteredProducts = this.products;
          this.productCtrl.setValue(allProduct);
        },
        _ => {
          this.toastr.warning(MessageConstants.GENERAL_ERROR);
        }
      );
  }
  compareProduct(p1: Product, p2: Product): boolean {
    return !p1 || !p2 ? false : p1.productId === p2.productId;
  }

  // For dropdown member
  getListMember() {
    this.loadingMember = true;
    this.orgMemberService
      .getMembers(<GetMembersReq>{ orgUuid: X.orgUuid }, { page: 0, perPage: 2000 })
      .subscribe(res => {
        this.loadingMember = false;
        this.members = res.content ?? [];
        const allMember = new Member({ displayName: `All Members (${this.members.length})`, memberUuid: '' });
        this.members = [allMember, ...this.members];
        this.filteredMembers = this.members;
        this.memberCtrl.setValue(allMember);
      });
  }
  compareMember(m1: Member, m2: Member): boolean {
    return !m1 || !m2 ? false : m1.uuid === m2.uuid;
  }

  update(isReloadPage: boolean) {
    if (isReloadPage) {
      this.listSubscription.paginatorRef.refreshCurrentPage();
    }
  }

  resetViewDetail() {
    this.detailSubscription.viewMain = true;
    this.detailSubscription.viewNumbers = false;
    this.detailSubscription.viewUsers = false;
  }
}
