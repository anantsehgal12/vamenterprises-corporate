import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  products: {
    category: r.one.categories({
      from: r.products.categoryId,
      to: r.categories.id,
    }),
    brand: r.one.brands({
      from: r.products.brandId,
      to: r.brands.id,
    }),
    // named imageRows because products already has an `images` jsonb column
    imageRows: r.many.images({
      from: r.products.id,
      to: r.images.productId,
    }),
    clicks: r.many.productClicks({
      from: r.products.id,
      to: r.productClicks.productId,
    }),
    queryItems: r.many.bulkQueryItems({
      from: r.products.id,
      to: r.bulkQueryItems.productId,
    }),
  },

  categories: {
    products: r.many.products({
      from: r.categories.id,
      to: r.products.categoryId,
    }),
  },

  brands: {
    products: r.many.products({
      from: r.brands.id,
      to: r.products.brandId,
    }),
    imageRows: r.many.images({
      from: r.brands.id,
      to: r.images.brandId,
    }),
  },

  images: {
    product: r.one.products({
      from: r.images.productId,
      to: r.products.id,
    }),
    brand: r.one.brands({
      from: r.images.brandId,
      to: r.brands.id,
    }),
  },

  catalogueLinks: {
    views: r.many.linkViews({
      from: r.catalogueLinks.id,
      to: r.linkViews.catalogueLinkId,
    }),
    clicks: r.many.productClicks({
      from: r.catalogueLinks.id,
      to: r.productClicks.catalogueLinkId,
    }),
    queries: r.many.bulkQueries({
      from: r.catalogueLinks.id,
      to: r.bulkQueries.catalogueLinkId,
    }),
  },

  bulkQueries: {
    category: r.one.categories({
      from: r.bulkQueries.categoryId,
      to: r.categories.id,
    }),
    catalogueLink: r.one.catalogueLinks({
      from: r.bulkQueries.catalogueLinkId,
      to: r.catalogueLinks.id,
    }),
    items: r.many.bulkQueryItems({
      from: r.bulkQueries.id,
      to: r.bulkQueryItems.bulkQueryId,
    }),
  },

  bulkQueryItems: {
    bulkQuery: r.one.bulkQueries({
      from: r.bulkQueryItems.bulkQueryId,
      to: r.bulkQueries.id,
    }),
    product: r.one.products({
      from: r.bulkQueryItems.productId,
      to: r.products.id,
    }),
  },

  linkViews: {
    catalogueLink: r.one.catalogueLinks({
      from: r.linkViews.catalogueLinkId,
      to: r.catalogueLinks.id,
    }),
  },

  productClicks: {
    catalogueLink: r.one.catalogueLinks({
      from: r.productClicks.catalogueLinkId,
      to: r.catalogueLinks.id,
    }),
    product: r.one.products({
      from: r.productClicks.productId,
      to: r.products.id,
    }),
  },
}));