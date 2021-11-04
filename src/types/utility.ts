export type OneOf<T> = T extends Array<unknown> ? T[number] : T[keyof T];
