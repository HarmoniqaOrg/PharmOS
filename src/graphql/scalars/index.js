const { GraphQLScalarType, GraphQLError } = require('graphql');
const { Kind } = require('graphql/language');

// DateTime scalar
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value) {
    // Convert outgoing Date to ISO string
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
  },
  parseValue(value) {
    // Convert incoming string to Date
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
      }
      return date;
    }
    throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
  },
  parseLiteral(ast) {
    // Convert hard-coded AST string to Date
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Value is not a valid DateTime: ${ast.value}`);
      }
      return date;
    }
    throw new GraphQLError(`Can only parse strings to dates but got a: ${ast.kind}`);
  },
});

// JSON scalar
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    // Convert outgoing object to JSON
    if (value === null || value === undefined) {
      return null;
    }
    return value;
  },
  parseValue(value) {
    // Convert incoming JSON to object
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        throw new GraphQLError(`Value is not a valid JSON string: ${value}`);
      }
    }
    return value;
  },
  parseLiteral(ast) {
    // Convert hard-coded AST to object
    switch (ast.kind) {
      case Kind.STRING:
        try {
          return JSON.parse(ast.value);
        } catch (error) {
          throw new GraphQLError(`Value is not a valid JSON string: ${ast.value}`);
        }
      case Kind.OBJECT:
        return parseObject(ast);
      case Kind.LIST:
        return ast.values.map(parseValue);
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.NULL:
        return null;
      default:
        throw new GraphQLError(`Unexpected kind in JSON literal: ${ast.kind}`);
    }
  },
});

// Helper function to parse object literals
function parseObject(ast) {
  const obj = {};
  ast.fields.forEach((field) => {
    obj[field.name.value] = parseValue(field.value);
  });
  return obj;
}

function parseValue(ast) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
      return parseInt(ast.value, 10);
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(ast);
    case Kind.LIST:
      return ast.values.map(parseValue);
    case Kind.NULL:
      return null;
    default:
      throw new GraphQLError(`Unexpected kind: ${ast.kind}`);
  }
}

module.exports = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
};