export interface IAccount {
  username: string;
  password?: string;
  sharedSecret?: string;
}

export interface ISettings {
  enabled: boolean;
}

export interface IStats {
  totalLogins: number;
}

export type View = "home" | "add-account" | "settings";
