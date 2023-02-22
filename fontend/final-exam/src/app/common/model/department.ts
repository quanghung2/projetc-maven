import { Account } from "./account";

export interface Department {
    id: number;
    name: string;
    type: string;
    accounts: Account[];
}