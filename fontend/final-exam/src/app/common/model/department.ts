import { Account } from "./account";

export interface Department {
    name: string;
    type: string;
    datetime: string;
    accounts: Account[];
}