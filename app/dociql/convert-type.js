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

function convertType(type, disableExampleValues = false, example = null) {
    if (type instanceof GraphQLNonNull)
        return Object.assign(convertType(type.ofType, disableExampleValues, example), {
            required: true
        });
    if (type instanceof GraphQLList) {        
        return {
            type: 'array',
            items: convertType(type.ofType, disableExampleValues, example)
        }
    }

    if (!disableExampleValues && type instanceof GraphQLInputObjectType) {
        const properties = {};
        const fields = type.getFields();
        const keys = Object.keys(fields);

        keys.forEach((key) => {
            properties[key] = convertType(
                fields[key].type,
                disableExampleValues,
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