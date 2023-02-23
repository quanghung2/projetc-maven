import { Pipe, PipeTransform } from '@angular/core';

declare var _: any;

@Pipe({
  name: 'country'
})
export class CountryPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (value) {
      var n = value.replace('+', '');
      var co = _.filter(countries, c => n.indexOf(c.prefix) == 0);
      if (args && args.length > 0 && args[1] == 'lowercase') {
        return co.length > 0 ? co[0].code.toLowerCase() : '';
      } else {
        return co.length > 0 ? co[0].code : '';
      }
    } else {
      return '';
    }
  }
}

export const countries: any = [
  {
    code: 'CA',
    prefix: '1'
  },
  {
    code: 'SX',
    prefix: '1'
  },
  {
    code: 'US',
    prefix: '1'
  },
  {
    code: 'BS',
    prefix: '1242'
  },
  {
    code: 'BB',
    prefix: '1246'
  },
  {
    code: 'AI',
    prefix: '1264'
  },
  {
    code: 'AG',
    prefix: '1268'
  },
  {
    code: 'VG',
    prefix: '1284'
  },
  {
    code: 'VI',
    prefix: '1340'
  },
  {
    code: 'KY',
    prefix: '1345'
  },
  {
    code: 'BM',
    prefix: '1441'
  },
  {
    code: 'GD',
    prefix: '1473'
  },
  {
    code: 'MF',
    prefix: '1599'
  },
  {
    code: 'TC',
    prefix: '1649'
  },
  {
    code: 'MS',
    prefix: '1664'
  },
  {
    code: 'MP',
    prefix: '1670'
  },
  {
    code: 'GU',
    prefix: '1671'
  },
  {
    code: 'AS',
    prefix: '1684'
  },
  {
    code: 'LC',
    prefix: '1758'
  },
  {
    code: 'DM',
    prefix: '1767'
  },
  {
    code: 'VC',
    prefix: '1784'
  },
  {
    code: 'PR',
    prefix: '1787'
  },
  {
    code: 'DO',
    prefix: '1809'
  },
  {
    code: 'TT',
    prefix: '1868'
  },
  {
    code: 'KN',
    prefix: '1869'
  },
  {
    code: 'JM',
    prefix: '1876'
  },
  {
    code: 'EG',
    prefix: '20'
  },
  {
    code: 'SS',
    prefix: '211'
  },
  {
    code: 'MA',
    prefix: '212'
  },
  {
    code: 'DZ',
    prefix: '213'
  },
  {
    code: 'TN',
    prefix: '216'
  },
  {
    code: 'LY',
    prefix: '218'
  },
  {
    code: 'GM',
    prefix: '220'
  },
  {
    code: 'SN',
    prefix: '221'
  },
  {
    code: 'MR',
    prefix: '222'
  },
  {
    code: 'ML',
    prefix: '223'
  },
  {
    code: 'GN',
    prefix: '224'
  },
  {
    code: 'CI',
    prefix: '225'
  },
  {
    code: 'BF',
    prefix: '226'
  },
  {
    code: 'NE',
    prefix: '227'
  },
  {
    code: 'TG',
    prefix: '228'
  },
  {
    code: 'BJ',
    prefix: '229'
  },
  {
    code: 'MU',
    prefix: '230'
  },
  {
    code: 'LR',
    prefix: '231'
  },
  {
    code: 'SL',
    prefix: '232'
  },
  {
    code: 'GH',
    prefix: '233'
  },
  {
    code: 'NG',
    prefix: '234'
  },
  {
    code: 'TD',
    prefix: '235'
  },
  {
    code: 'CF',
    prefix: '236'
  },
  {
    code: 'CM',
    prefix: '237'
  },
  {
    code: 'CV',
    prefix: '238'
  },
  {
    code: 'ST',
    prefix: '239'
  },
  {
    code: 'GQ',
    prefix: '240'
  },
  {
    code: 'GA',
    prefix: '241'
  },
  {
    code: 'CG',
    prefix: '242'
  },
  {
    code: 'CD',
    prefix: '243'
  },
  {
    code: 'AO',
    prefix: '244'
  },
  {
    code: 'GW',
    prefix: '245'
  },
  {
    code: 'DG',
    prefix: '246'
  },
  {
    code: 'IO',
    prefix: '246'
  },
  {
    code: 'AC',
    prefix: '247'
  },
  {
    code: 'SC',
    prefix: '248'
  },
  {
    code: 'SD',
    prefix: '249'
  },
  {
    code: 'RW',
    prefix: '250'
  },
  {
    code: 'ET',
    prefix: '251'
  },
  {
    code: 'SO',
    prefix: '252'
  },
  {
    code: 'DJ',
    prefix: '253'
  },
  {
    code: 'KE',
    prefix: '254'
  },
  {
    code: 'TZ',
    prefix: '255'
  },
  {
    code: 'UG',
    prefix: '256'
  },
  {
    code: 'BI',
    prefix: '257'
  },
  {
    code: 'MZ',
    prefix: '258'
  },
  {
    code: 'ZM',
    prefix: '260'
  },
  {
    code: 'MG',
    prefix: '261'
  },
  {
    code: 'RE',
    prefix: '262'
  },
  {
    code: 'YT',
    prefix: '262'
  },
  {
    code: 'ZW',
    prefix: '263'
  },
  {
    code: 'NA',
    prefix: '264'
  },
  {
    code: 'MW',
    prefix: '265'
  },
  {
    code: 'LS',
    prefix: '266'
  },
  {
    code: 'BW',
    prefix: '267'
  },
  {
    code: 'SZ',
    prefix: '268'
  },
  {
    code: 'KM',
    prefix: '269'
  },
  {
    code: 'ZA',
    prefix: '27'
  },
  {
    code: 'SH',
    prefix: '290'
  },
  {
    code: 'ER',
    prefix: '291'
  },
  {
    code: 'AW',
    prefix: '297'
  },
  {
    code: 'FO',
    prefix: '298'
  },
  {
    code: 'GL',
    prefix: '299'
  },
  {
    code: 'GR',
    prefix: '30'
  },
  {
    code: 'NL',
    prefix: '31'
  },
  {
    code: 'BE',
    prefix: '32'
  },
  {
    code: 'FR',
    prefix: '33'
  },
  {
    code: 'ES',
    prefix: '34'
  },
  {
    code: 'GI',
    prefix: '350'
  },
  {
    code: 'PT',
    prefix: '351'
  },
  {
    code: 'LU',
    prefix: '352'
  },
  {
    code: 'IE',
    prefix: '353'
  },
  {
    code: 'IS',
    prefix: '354'
  },
  {
    code: 'AL',
    prefix: '355'
  },
  {
    code: 'MT',
    prefix: '356'
  },
  {
    code: 'CY',
    prefix: '357'
  },
  {
    code: 'AX',
    prefix: '358'
  },
  {
    code: 'FI',
    prefix: '358'
  },
  {
    code: 'BG',
    prefix: '359'
  },
  {
    code: 'HU',
    prefix: '36'
  },
  {
    code: 'LT',
    prefix: '370'
  },
  {
    code: 'LV',
    prefix: '371'
  },
  {
    code: 'EE',
    prefix: '372'
  },
  {
    code: 'MD',
    prefix: '373'
  },
  {
    code: 'AM',
    prefix: '374'
  },
  {
    code: 'BY',
    prefix: '375'
  },
  {
    code: 'AD',
    prefix: '376'
  },
  {
    code: 'MC',
    prefix: '377'
  },
  {
    code: 'SM',
    prefix: '378'
  },
  {
    code: 'VA',
    prefix: '379'
  },
  {
    code: 'UA',
    prefix: '380'
  },
  {
    code: 'RS',
    prefix: '381'
  },
  {
    code: 'ME',
    prefix: '382'
  },
  {
    code: 'HR',
    prefix: '385'
  },
  {
    code: 'SI',
    prefix: '386'
  },
  {
    code: 'BA',
    prefix: '387'
  },
  {
    code: '-',
    prefix: '388'
  },
  {
    code: 'MK',
    prefix: '389'
  },
  {
    code: 'IT',
    prefix: '39'
  },
  {
    code: 'RO',
    prefix: '40'
  },
  {
    code: 'CH',
    prefix: '41'
  },
  {
    code: 'CZ',
    prefix: '420'
  },
  {
    code: 'SK',
    prefix: '421'
  },
  {
    code: 'LI',
    prefix: '423'
  },
  {
    code: 'AT',
    prefix: '43'
  },
  {
    code: 'GB',
    prefix: '44'
  },
  {
    code: 'UK',
    prefix: '44'
  },
  {
    code: 'GG',
    prefix: '44'
  },
  {
    code: 'IM',
    prefix: '44'
  },
  {
    code: 'JE',
    prefix: '44'
  },
  {
    code: 'DK',
    prefix: '45'
  },
  {
    code: 'SE',
    prefix: '46'
  },
  {
    code: 'NO',
    prefix: '47'
  },
  {
    code: 'SJ',
    prefix: '47'
  },
  {
    code: 'PL',
    prefix: '48'
  },
  {
    code: 'DE',
    prefix: '49'
  },
  {
    code: 'FK',
    prefix: '500'
  },
  {
    code: 'BZ',
    prefix: '501'
  },
  {
    code: 'GT',
    prefix: '502'
  },
  {
    code: 'SV',
    prefix: '503'
  },
  {
    code: 'HN',
    prefix: '504'
  },
  {
    code: 'NI',
    prefix: '505'
  },
  {
    code: 'CR',
    prefix: '506'
  },
  {
    code: 'PA',
    prefix: '507'
  },
  {
    code: 'PM',
    prefix: '508'
  },
  {
    code: 'HT',
    prefix: '509'
  },
  {
    code: 'PE',
    prefix: '51'
  },
  {
    code: 'MX',
    prefix: '52'
  },
  {
    code: 'CU',
    prefix: '53'
  },
  {
    code: 'AR',
    prefix: '54'
  },
  {
    code: 'BR',
    prefix: '55'
  },
  {
    code: 'CL',
    prefix: '56'
  },
  {
    code: 'CO',
    prefix: '57'
  },
  {
    code: 'VE',
    prefix: '58'
  },
  {
    code: 'BL',
    prefix: '590'
  },
  {
    code: 'GP',
    prefix: '590'
  },
  {
    code: 'BO',
    prefix: '591'
  },
  {
    code: 'GY',
    prefix: '592'
  },
  {
    code: 'EC',
    prefix: '593'
  },
  {
    code: 'GF',
    prefix: '594'
  },
  {
    code: 'PY',
    prefix: '595'
  },
  {
    code: 'MQ',
    prefix: '596'
  },
  {
    code: 'SR',
    prefix: '597'
  },
  {
    code: 'UY',
    prefix: '598'
  },
  {
    code: 'AN',
    prefix: '599'
  },
  {
    code: 'BQ',
    prefix: '599'
  },
  {
    code: 'CW',
    prefix: '599'
  },
  {
    code: 'MY',
    prefix: '60'
  },
  {
    code: 'AU',
    prefix: '61'
  },
  {
    code: 'CC',
    prefix: '61'
  },
  {
    code: 'CX',
    prefix: '61'
  },
  {
    code: 'ID',
    prefix: '62'
  },
  {
    code: 'PH',
    prefix: '63'
  },
  {
    code: 'NZ',
    prefix: '64'
  },
  {
    code: 'SG',
    prefix: '65'
  },
  {
    code: 'TH',
    prefix: '66'
  },
  {
    code: 'TL',
    prefix: '670'
  },
  {
    code: 'AQ',
    prefix: '672'
  },
  {
    code: 'NF',
    prefix: '672'
  },
  {
    code: 'BN',
    prefix: '673'
  },
  {
    code: 'NR',
    prefix: '674'
  },
  {
    code: 'PG',
    prefix: '675'
  },
  {
    code: 'TO',
    prefix: '676'
  },
  {
    code: 'SB',
    prefix: '677'
  },
  {
    code: 'VU',
    prefix: '678'
  },
  {
    code: 'FJ',
    prefix: '679'
  },
  {
    code: 'PW',
    prefix: '680'
  },
  {
    code: 'WF',
    prefix: '681'
  },
  {
    code: 'CK',
    prefix: '682'
  },
  {
    code: 'NU',
    prefix: '683'
  },
  {
    code: 'WS',
    prefix: '685'
  },
  {
    code: 'KI',
    prefix: '686'
  },
  {
    code: 'NC',
    prefix: '687'
  },
  {
    code: 'TV',
    prefix: '688'
  },
  {
    code: 'PF',
    prefix: '689'
  },
  {
    code: 'TK',
    prefix: '690'
  },
  {
    code: 'FM',
    prefix: '691'
  },
  {
    code: 'MH',
    prefix: '692'
  },
  {
    code: 'KZ',
    prefix: '7'
  },
  {
    code: 'RU',
    prefix: '7'
  },
  {
    code: '00',
    prefix: '800'
  },
  {
    code: 'JP',
    prefix: '81'
  },
  {
    code: 'KR',
    prefix: '82'
  },
  {
    code: 'VN',
    prefix: '84'
  },
  {
    code: 'KP',
    prefix: '850'
  },
  {
    code: 'HK',
    prefix: '852'
  },
  {
    code: 'MO',
    prefix: '853'
  },
  {
    code: 'KH',
    prefix: '855'
  },
  {
    code: 'LA',
    prefix: '856'
  },
  {
    code: 'CN',
    prefix: '86'
  },
  {
    code: 'BD',
    prefix: '880'
  },
  {
    code: 'TW',
    prefix: '886'
  },
  {
    code: 'TR',
    prefix: '90'
  },
  {
    code: 'IN',
    prefix: '91'
  },
  {
    code: 'PK',
    prefix: '92'
  },
  {
    code: 'AF',
    prefix: '93'
  },
  {
    code: 'LK',
    prefix: '94'
  },
  {
    code: 'MM',
    prefix: '95'
  },
  {
    code: 'MV',
    prefix: '960'
  },
  {
    code: 'LB',
    prefix: '961'
  },
  {
    code: 'JO',
    prefix: '962'
  },
  {
    code: 'SY',
    prefix: '963'
  },
  {
    code: 'IQ',
    prefix: '964'
  },
  {
    code: 'KW',
    prefix: '965'
  },
  {
    code: 'SA',
    prefix: '966'
  },
  {
    code: 'YE',
    prefix: '967'
  },
  {
    code: 'OM',
    prefix: '968'
  },
  {
    code: 'PS',
    prefix: '970'
  },
  {
    code: 'AE',
    prefix: '971'
  },
  {
    code: 'IL',
    prefix: '972'
  },
  {
    code: 'BH',
    prefix: '973'
  },
  {
    code: 'QA',
    prefix: '974'
  },
  {
    code: 'BT',
    prefix: '975'
  },
  {
    code: 'MN',
    prefix: '976'
  },
  {
    code: 'NP',
    prefix: '977'
  },
  {
    code: 'IR',
    prefix: '98'
  },
  {
    code: 'TJ',
    prefix: '992'
  },
  {
    code: 'TM',
    prefix: '993'
  },
  {
    code: 'AZ',
    prefix: '994'
  },
  {
    code: 'GE',
    prefix: '995'
  },
  {
    code: 'KG',
    prefix: '996'
  },
  {
    code: 'UZ',
    prefix: '998'
  }
];
