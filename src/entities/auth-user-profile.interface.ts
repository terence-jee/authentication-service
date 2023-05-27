export interface AuthUserProfile {
  userid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  location: string;
  office: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: any;
  roles: Array<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rawProfile: any;
}
