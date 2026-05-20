// Mongoose 9 no longer exports `FilterQuery`. Module augmentation lets us
// re-expose the internal `QueryFilter` under the old name so existing page
// queries keep type-checking. Importing this module anywhere ensures the
// declaration is loaded.
import "mongoose";

declare module "mongoose" {
  export type FilterQuery<T> = QueryFilter<T>;
}
