import { Account } from "./account";

export interface Department {
    id: number;
    name: string;
    type: string;
    accounts: AccountDepartMent[];
}

export interface AccountDepartMent {
    accountId: number;
    username: string;
}