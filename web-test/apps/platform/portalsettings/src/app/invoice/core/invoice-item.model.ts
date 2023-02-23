import { NumberUtils } from '../../utils/number-utils';
import { PercentageConverter } from '../../utils/percentage-utils';
import { StringUtils } from '../../utils/string-utils';
import { ProductItemType } from './product-item-type.enum';

export class InvoiceItem {
  id: number;
  productId: string;
  sku: string;
  saleModel: string;
  name: string;
  description: string;
  private _period: number = 1;
  private _quantity: number;
  private _baseUnitPrice: number; // unit price based on 1 period
  private _unitPriceExclTax: number;
  private _taxRate: number;
  private _discount: number;
  discountAmount: number;
  type: string;
  provisioned: boolean;
  provisionedDate: number;
  groupLabel: string;
  groupId: string;

  // additional properties
  productName: string;
  skuName: string;

  private _rawPriceExclTax: number; // for input amount

  constructor() {
    this.type = ProductItemType[ProductItemType.CUSTOM];
  }

  get grouped(): boolean {
    return StringUtils.isNotBlank(this.groupId);
  }

  /**
   * Quantity
   */
  get quantity(): number {
    if (this._quantity == null || isNaN(this._quantity)) {
      return undefined;
    }
    return this._quantity;
  }
  set quantity(qt: number) {
    if (qt == null || isNaN(qt)) {
      this._quantity = undefined;
    } else {
      this._quantity = qt;
    }
  }

  /**
   * Base unit price
   */
  get baseUnitPrice(): number {
    if (this._baseUnitPrice == null || isNaN(this._baseUnitPrice)) {
      return 0;
    }
    return this._baseUnitPrice;
  }
  set baseUnitPrice(value) {
    if (value == null || isNaN(value)) {
      this._baseUnitPrice = 0;
    } else {
      this._baseUnitPrice = NumberUtils.roundTo4Digits(value);
    }
  }

  /**
   * Unit price excluding tax
   */
  get unitPriceExclTax(): number {
    if (this._unitPriceExclTax == null || isNaN(this._unitPriceExclTax)) {
      return undefined;
    }
    return this._unitPriceExclTax;
  }
  set unitPriceExclTax(value) {
    if (value == null || isNaN(value)) {
      this._unitPriceExclTax = undefined;
      this.baseUnitPrice = 0;
    } else {
      this._unitPriceExclTax = NumberUtils.roundTo4Digits(value);
      this.baseUnitPrice = NumberUtils.roundTo4Digits(this._unitPriceExclTax / this.period);
    }
    this._rawPriceExclTax = this._unitPriceExclTax;
  }

  /**
   * Unit price excluding tax used for DOM input
   */
  get rawUnitPriceExclTax(): number {
    return this._rawPriceExclTax;
  }
  set rawUnitPriceExclTax(value) {
    this.unitPriceExclTax = value;
    this._rawPriceExclTax = value;
  }

  /**
   * Period
   */
  get period(): number {
    if (this._period == null || isNaN(this._period)) {
      return 1;
    }
    return this._period;
  }
  set period(value) {
    if (value == null || isNaN(value)) {
      this._period = 1;
    } else {
      this._period = value;
    }
    this.unitPriceExclTax = this.baseUnitPrice * this._period;
  }

  /**
   * Discount
   */
  get discount(): number {
    return this._discount == null ? 0 : this._discount;
  }
  set discount(dsc: number) {
    if (dsc == null || isNaN(dsc)) {
      this._discount = undefined;
    } else {
      this._discount = dsc;
    }
  }
  get discountPercent(): number {
    return this._discount == null ? undefined : PercentageConverter.toPercent(this.discount);
  }
  set discountPercent(pct: number) {
    if (pct == null || isNaN(pct)) {
      this._discount = undefined;
    } else {
      this._discount = PercentageConverter.toRealValue(pct);
    }
  }

  /**
   * Tax rate
   */
  get taxRate(): number {
    return this._taxRate == null ? 0 : this._taxRate;
  }
  set taxRate(r: number) {
    if (r == null || isNaN(r)) {
      this._taxRate = undefined;
    } else {
      this._taxRate = r;
    }
  }
  get taxRatePercent(): number {
    if (this._taxRate == null || isNaN(this._taxRate)) {
      return undefined;
    }
    return PercentageConverter.toPercent(this.taxRate);
  }
  set taxRatePercent(pct: number) {
    if (pct == null || isNaN(pct)) {
      this._taxRate = undefined;
    } else {
      this._taxRate = PercentageConverter.toRealValue(pct);
    }
  }

  /**
   * Amount including tax
   */
  get amountInclTax(): number {
    return this.isValid() ? NumberUtils.roundTo3Digits(this.amountExclTax * (1 + this.taxRate)) : 0;
  }

  /**
   * Amount excluding tax
   */
  get amountExclTax(): number {
    return this.isValid()
      ? NumberUtils.roundTo3Digits(this.quantity * (this.unitPriceExclTax - this.discountAmount))
      : 0;
  }

  /**
   * Total tax amount of the item
   */
  get totalTaxAmount(): number {
    return this.isValid() ? NumberUtils.roundTo3Digits(this.amountExclTax * this.taxRate) : 0;
  }

  /**
   * Total discount amount of the item
   */
  get totalDiscountAmount(): number {
    return this.isValid() ? NumberUtils.roundTo3Digits(this.quantity * this.discountAmount) : 0;
  }

  isValid(): boolean {
    return this.quantity != null && this.quantity > 0 && this.unitPriceExclTax != null && this.unitPriceExclTax >= 0;
  }

  isSubscriptionType(): boolean {
    return this.type === ProductItemType[ProductItemType.SUBSCRIPTION];
  }

  isTopupType(): boolean {
    return this.type === ProductItemType[ProductItemType.TOPUP];
  }

  isMonthlySubscription(): boolean {
    return this.isSubscriptionType() && this.saleModel === 'monthly';
  }

  isYearlySubscription(): boolean {
    return this.isSubscriptionType() && this.saleModel === 'yearly';
  }
}
