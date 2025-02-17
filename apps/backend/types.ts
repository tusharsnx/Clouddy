/**
 * Pick keys from T whose values are of type V.
 */
export type PickKeys<T extends object, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Omit keys from T whose values are of type V.
 */
export type OmitKeys<T extends object, V> = {
  [K in keyof T]: T[K] extends V ? never : K;
}[keyof T];

/**
 * Pick properties from T whose values are of type V.
 */
export type PickProps<T extends object, V> = Pick<T, PickKeys<T, V>>;

/**
 * Remove properties from T whose values are of type V.
 */
export type OmitProps<T extends object, V> = Omit<T, PickKeys<T, V>>;
