export const RESULT_DPO = {
  permitted: {
    consent: 'Because of whitelist (both org or personal)',
    coverage: 'Because the number is non-SG',
    bypass: 'Because the user configures bypass or override DNC, and the org is NOT compliant',
    licence: 'Because of missing or terminated subscription/licence and the org is NOT compliant.',
    credit: 'because of insufficent credit and the org is NOT compliant',
    dnc: ''
  },
  blocked: {
    consent: 'Because of blacklist',
    coverage: '',
    bypass: '',
    licence: 'Because of missing or terminated subscription/licence and the org is COMPLIANT',
    credit: 'Because of insufficent credit and the org is COMPLIANT',
    dnc: 'Because of DNC'
  }
};
