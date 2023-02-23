import { CountryOutboundRule } from '@b3networks/api/callcenter';
import { countryMapping } from './countries-mapping';

export function getCountries() {
  const code2CountryMap = {};
  const countries = new Array<CountryOutboundRule>();
  for (const key in countryMapping) {
    if (countryMapping.hasOwnProperty(key)) {
      const code = countryMapping[key].code.replace(/\s/g, '');
      if (code.length > 0) {
        const c = new CountryOutboundRule();
        c.id = key;
        c.name = countryMapping[key].name;
        c.code = code;
        countries.push(c);
        if (code2CountryMap[code] !== undefined) {
          code2CountryMap[code] = {
            id: code2CountryMap[code].id + ',' + key,
            name: code2CountryMap[code].name + ', ' + countryMapping[key].name
          };
        } else {
          code2CountryMap[code] = {
            id: key,
            name: countryMapping[key].name
          };
        }
      }
    }
  }
  return countries.map(c => new CountryOutboundRule(c));
}
