export interface Welcome {
  data: Data;
}

export interface Data {
  items: Item[];
}

export interface Item {
  type: Type;
  key: string;
  locale: Locale;
  name: string;
  description: string;
  imageUrl: string;
  roleKey: RoleKey;
  roleName: RoleName;
}

export enum Locale {
  EnUS = 'en-US'
}

export enum RoleKey {
  Duelist = 'duelist',
  Strategist = 'strategist',
  Unknown = 'unknown',
  Vanguard = 'vanguard'
}

export enum RoleName {
  Duelist = 'Duelist',
  Strategist = 'Strategist',
  Unknown = 'Unknown',
  Vanguard = 'Vanguard'
}

export enum Type {
  Hero = 'hero'
}
