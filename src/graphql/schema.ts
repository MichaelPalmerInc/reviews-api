import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import Product from '../models/Product';

// const schema = buildSchema(`
//   type Review {
//     review_id: Int!
//     rating: Int!
//     summary: String
//     recommend: Boolean!
//     reported: Boolean
//     response: String
//     body: String!
//     date: String!
//     reviewer_email: String!
//     reviewer_name: String!
//     helpfulness: Int!
//     photos: [Photo]
//   }

//   type Photo {
//     id: Int!
//     url: String!
//   }

//   type Characteristic {
//     id: Int!
//     name: String!
//   }

//   type Query {
//     getReviewsByProduct(id: Int!): [Review]
//     getReview(id: Int!): Review
//     markReviewHelpful(id: Int!): Boolean
//     reportReview(id: Int!): Boolean
//   }
// `);

const ReviewType = new GraphQLObjectType({
  name: 'Review',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (obj) => obj.review_id,
    },
    review_id: { type: GraphQLInt },
    rating: { type: GraphQLInt },
    summary: { type: GraphQLString },
    recommend: { type: GraphQLBoolean },
    reported: { type: GraphQLBoolean },
    response: { type: GraphQLString },
    body: { type: GraphQLString },
    date: { type: GraphQLString },
    reviewer_email: { type: GraphQLString },
    reviewer_name: { type: GraphQLString },
    helpfulness: { type: GraphQLInt },
    characteristics: { type: GraphQLString, resolve: (obj) => JSON.stringify(obj.characteristics) },
    photos: { type: GraphQLList(PhotoType) },
  }),
});

const PhotoType = new GraphQLObjectType({
  name: 'Photo',
  fields: () => ({
    id: { type: GraphQLInt },
    url: { type: GraphQLString },
  }),
});

const CharacteristicType = new GraphQLObjectType({
  name: 'Characteristic',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
  }),
});

const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: () => ({
    id: { type: GraphQLInt, resolve: (obj) => obj.product_id },
    characteristics: { type: GraphQLList(CharacteristicType) },
    reviews: { type: GraphQLList(ReviewType) },
  }),
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    Review: {
      type: ReviewType,
      args: {
        id: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (source, args, context) => {
        return await context.loaders.reviews.load(args.id);
      },
    },
    Reviews: {
      type: GraphQLList(ReviewType),
      args: {
        product_id: { type: GraphQLNonNull(GraphQLInt) },
        count: { type: GraphQLInt },
        page: { type: GraphQLInt },
        sort: {
          type: new GraphQLEnumType({
            name: 'ReviewSort',
            values: {
              NEWEST: { value: 'newest' },
              HELPFUL: { value: 'helpful' },
              RELEVANT: { value: 'relevant' },
            },
          }),
        },
      },
      resolve: async (source, args, context) => {
        console.log('Args: ', args);
        const count = args.count ?? 5;
        const page = args.page ?? 0;
        const reviews = (await context.loaders.products.load(args.product_id)).reviews;
        return reviews.slice(count * page, count * (page + 1));
      },
    },
    Product: {
      type: ProductType,
      args: {
        id: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (source, args, context) => {
        return await context.loaders.products.load(args.id);
      },
    },
  }),
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({}),
});

export default new GraphQLSchema({ query: QueryType });
