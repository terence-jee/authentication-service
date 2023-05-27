import { Lookup } from './lookup.interface';

export interface AlbertaCaAccountType extends Lookup {
  verified?: boolean;
}

export const AlbertaCaAccountTypes: { [name: string]: AlbertaCaAccountType } = {
  Basic: { code: '1', displayValue: 'Basic', verified: false },
  PendingVerified: { code: '2', displayValue: 'Pending Verified', verified: false },
  Verified: { code: '3', displayValue: 'Verified', verified: true },
};

export const AlbertaCaGenderTypes: { [name: string]: Lookup } = {
  Undefined: { code: '0', displayValue: 'Undefined' },
  Male: { code: '1', displayValue: 'Male' },
  Female: { code: '2', displayValue: 'Female' },
};

export interface IdpDataAlbertaCa {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  gender?: Lookup;
  accountType?: AlbertaCaAccountType;
  status?: string;
  verified?: boolean;
  dateOfBirth?: Date;
  country?: string;
  provState?: string;
  city?: string;
  postalZipCode?: string;
  streetAddress1?: string;
  streetAddress2?: string;
  mobilePhone?: string;
  homePhone?: string;
}
