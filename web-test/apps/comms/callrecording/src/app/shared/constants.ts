export const X_PAGINATION = {
  totalCount: 'x-pagination-total-count'
};

export const USER_INFO = {
  orgUuid: 'orgUuid',
  sessionToken: 'sessionToken'
};

export const X_ORG = 'x-user-org-uuid';

export function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
