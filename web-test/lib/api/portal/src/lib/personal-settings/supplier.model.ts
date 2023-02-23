import { AppSettings } from './callcenter-setting.model';

export interface SupplierAppSettings extends AppSettings {
  filterSupplier?: string;
  filterRouting?: string;
  filterMapping?: string;
}
