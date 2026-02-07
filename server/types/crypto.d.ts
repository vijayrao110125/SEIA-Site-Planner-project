declare module "crypto" {
  export function createHmac(...args: any[]): any;
  export function randomBytes(...args: any[]): any;
  export function scryptSync(...args: any[]): any;
  export function timingSafeEqual(...args: any[]): any;
}

