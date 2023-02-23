import { CountryOutboundRule } from '@b3networks/api/callcenter';
import { CountryCodes } from '@b3networks/shared/common';

export function getCountries() {
  const code2CountryMap = {};
  const countries = new Array<CountryOutboundRule>();
  for (const key in CountryCodes) {
    if (CountryCodes.hasOwnProperty(key)) {
      const code = CountryCodes[key].PhoneCode.toString().replace(/[-]/g, '');
      if (code.length > 0) {
        const c = new CountryOutboundRule();
        c.id = key;
        c.name = CountryCodes[key].CountryName;
        c.code = code;
        c.ISO2 = CountryCodes[key].ISO2;
        countries.push(c);
        if (code2CountryMap[code] !== undefined) {
          code2CountryMap[code] = {
            id: code2CountryMap[code].id + ',' + key,
            name: code2CountryMap[code].name + ', ' + CountryCodes[key].CountryName
          };
        } else {
          code2CountryMap[code] = {
            id: key,
            name: CountryCodes[key].CountryName
          };
        }
      }
    }
  }
  return countries.map(c => new CountryOutboundRule(c));
}
