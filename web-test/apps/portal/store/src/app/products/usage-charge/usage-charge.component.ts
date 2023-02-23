import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GeoService, OrganizationService } from '@b3networks/api/auth';
import { PartnerService } from '@b3networks/api/partner';
import { Product, ProductService } from '@b3networks/api/store';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AuthService as CountryService } from '../../../../../../platform/portalsettings/src/app/core/services/private-http/auth.service';

const usageChargeType = 'TELECOM';

@Component({
  selector: 'store-usage-charge',
  templateUrl: './usage-charge.component.html',
  styleUrls: ['./usage-charge.component.scss']
})
export class UsageChargeComponent implements OnInit {
  countryControl = new FormControl();
  filteredCountries$: Observable<any[]>;

  currency: string;
  countries: any[];

  products: Product[];
  selectedProduct: any;

  telcoms: any[];
  selectedTelcom: any;
  loading: boolean;
  selectedCountry: string;

  constructor(
    private route: ActivatedRoute,
    private geoService: GeoService,
    private partnerService: PartnerService,
    private orgService: OrganizationService,
    private countryService: CountryService,
    private messageService: ToastService,
    private productService: ProductService
  ) {}

  async ngOnInit() {
    this.loading = true;

    await this.countryService
      .getCountries()
      .toPromise()
      .then(countries => {
        this.countries = countries;
      });

    await this.geoService
      .getGeoInfo({ forceLoad: true })
      .toPromise()
      .then(country => {
        this.selectedCountry = country.countryName;
        this.countryControl.setValue(this.countries.find(c => c.name === country.countryName));
        this.filteredCountries$ = this.countryControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            if (typeof value === 'string') {
              return this.countries.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
            } else {
              this.selectedCountry = value.name;
              return this.countries;
            }
          })
        );
      });

    forkJoin([
      this.partnerService.getPartnerByDomain({ forceLoad: true }),
      this.orgService.getOrganizationByUuid(X.orgUuid),
      this.productService.fetchProducts(usageChargeType, 1, 1000),
      this.productService.fetchProducts('APP', 1, 1000)
    ]).subscribe(
      data => {
        this.currency = data[1] ? data[1].walletCurrencyCode : data[0].supportedCurrencies[0];
        this.buildTelComs(data[2]);
        this.products = data[3].filter(product => product.telcomType != null);

        this.route.params.subscribe(params => {
          if (params['id']) {
            this.filterByProduct(params['id']);
          } else {
            this.changeTelcom(this.telcoms[0]);
          }
        });

        this.loading = false;
      },
      error => {
        this.messageService.warning(error.json().message);
        this.loading = false;
      }
    );
  }

  changeTelcom(telcom: any) {
    this.selectedTelcom = telcom;
    this.selectedTelcom['loading'] = true;

    forkJoin(
      this.selectedTelcom.products.map(product =>
        this.productService.getProductDetail(product.productId, this.currency)
      )
    ).subscribe(
      products => {
        this.selectedTelcom.products = products;
        this.selectedTelcom['loading'] = false;
      },
      error => {
        this.messageService.warning(error.json().message);
        this.selectedTelcom['loading'] = false;
      }
    );
  }

  filterByProduct(productId: string) {
    this.telcoms.filter(telcom => telcom['hidden']).map(telcom => (telcom['hidden'] = false));

    this.selectedProduct = this.products.find(product => product.productId === productId);
    if (this.selectedProduct) {
      this.telcoms
        .filter(telcom => telcom.type !== this.selectedProduct.telcomType)
        .map(telcom => (telcom['hidden'] = true));
      const foundTelcom = this.telcoms.find(telcom => telcom.type === this.selectedProduct.telcomType);
      foundTelcom['hidden'] = false;
      this.changeTelcom(foundTelcom);
    }
  }

  displayFn(country) {
    return country.name;
  }

  private buildTelComs(products: Product[]) {
    this.telcoms = [];
    products.forEach(product => {
      const telcomCode = product.productId.split('-')[0];
      let telcom = this.telcoms.find(tc => tc.type === telcomCode);
      if (!telcom) {
        telcom = {
          type: telcomCode,
          products: []
        };
        this.telcoms.push(telcom);
      }
      telcom.products.push(product);
      telcom.products.sort((a, b) => b.productId > a.productId);
    });
  }
}
