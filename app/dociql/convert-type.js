const {
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLScalarType
} = require("graphql")

const retrieveExampleFromDescription = require('../helpers/exampleFromDescription');

const SCALARS = {
    Int: 'integer',
    Float: 'number',
    String: 'string',
    Boolean: 'boolean',
    ID: 'string'
};

function convertType(type, example = null) {
    if (type instanceof GraphQLNonNull)
        return Object.assign(convertType(type.ofType), {
            required: true
        });
    if (type instanceof GraphQLList) {        
        return {
            type: 'array',
            items: convertType(type.ofType)
        }
    }

    if (type instanceof GraphQLInputObjectType) {
        const properties = {};
        const fields = type.getFields();
        const keys = Object.keys(fields);

        keys.forEach((key) => {
            properties[key] = convertType(
                fields[key].type,
                retrieveExampleFromDescription(fields[key].description)
            );
        });

        return {
            type: 'object',
            $ref: `#/definitions/${type.name}`,
            properties
        }
    }

    if (type instanceof GraphQLScalarType) {
        return {
            type: SCALARS[type.name],
            example: example !== null ? example : SCALARS[type.name]
        };
    }
    
    return { $ref: `#/definitions/${type.name}`};         
}

module.exports = convertType