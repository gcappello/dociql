const {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList
} = require("graphql")

const retrieveExampleFromDescription = require('../helpers/exampleFromDescription');

const SCALARS = {
    Int: 'integer',
    Float: 'number',
    String: 'string',
    Boolean: 'boolean',
    ID: 'string'
};

function generateQueryInternal(field, expandGraph, arguments, depth, typeCounts = []) {
    const space = '  '.repeat(depth)
    var queryStr = space + field.name

    // It's important to clone the array here. Otherwise we would
    // be pushing arguments into the array passed by reference,
    // which results in arguments from one query being incorrectly
    // shown on another query's example.
    const fieldArgs = [...arguments];

    if (field.args.length > 0) {
        fieldArgs.push(...field.args);
        const argsStr = field.args.map(arg => `${arg.name}: $${arg.name}`).join(', ');
        queryStr += `(${argsStr})`;
    }

    var returnType = field.type;

    while(returnType.ofType) {
        returnType = returnType.ofType;
    }

    if (returnType.getFields) {
        var subQuery = null;
        const expandedField = expandGraph.find(_ => _.field == field.name)

        if (!expandedField)
            return {
                query: "",
                args: fieldArgs
            };

        if (depth > 1) {
            const typeKey = `${field.name}->${returnType.name}`;
            if (typeCounts.includes(typeKey)) {
                subQuery = space + "  ...Recursive" + returnType.name + "Fragment\n"
            }
            typeCounts.push(typeKey)
        }

        var childFields = returnType.getFields();
        var keys = Object.keys(childFields);
        const toExpand = expandGraph.map(_ => _.field);
        const toSelect = expandedField ? expandedField.select : null;

        keys = toSelect ? keys.filter(key => toSelect.includes(key) || toExpand.includes(key)) : keys;
        subQuery = subQuery || keys.map(key => {
            return generateQueryInternal(
                childFields[key],
                expandGraph,
                fieldArgs,
                depth + 1,
                [...typeCounts]).query
        }).join("");

        queryStr += `{\n${subQuery}${space}}`
    }

    return {
        query: queryStr + "\n",
        args: fieldArgs
    };
}

function generateExampleSchema(name, type, expandGraph, depth, disableExampleValues = false, example = null) {
    const expandedField = expandGraph.find(_ => _.field == name)

    if (depth > 10)
        return {
            type: "object"
        };

    if (type instanceof GraphQLObjectType) {
        if (!expandedField)
            return null;
        var result = {
            type: "object"
        }
        var fields = type.getFields()
        let keys = Object.keys(fields);
        const toExpand = expandGraph.map(_ => _.field)
        const toSelect = expandedField ? expandedField.select : null;

        keys = toSelect ? keys.filter(key => toSelect.includes(key) || toExpand.includes(key)) : keys;

        result.properties = keys.reduce((p, key) => {
            const schema = generateExampleSchema(
                key,
                fields[key].type,
                expandGraph.filter(_=>_ !== expandedField),
                depth + 1,
                disableExampleValues,
                disableExampleValues ? null : retrieveExampleFromDescription(fields[key].description)
            )

            if (schema) {
                p[key] = schema;
            }

            return p;
        }, {})

        return result;
    }
    if (type instanceof GraphQLNonNull)
        return generateExampleSchema(name, type.ofType, expandGraph, depth + 1, disableExampleValues, example);
    if (type instanceof GraphQLList) {
        const schema = generateExampleSchema(name, type.ofType, expandGraph, depth, disableExampleValues, example) // do not increment depth
        return schema ? {
            type: 'array',
            items: schema,
            example: example !== null ? example : SCALARS[type.name]
        } : null;
    }

    return {
        type: SCALARS[type.name],
        example: example !== null ? example : SCALARS[type.name]
    }
}

function generateExampleSchemaErrors(errorList) {
    const errors = [];
    errorList.forEach((error) => {
        errors[error.code] = {
            description: error.description,
            schema: {
                "$ref": "#/definitions/Errors",
                example: {
                    type: "object",
                    properties: {
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    message: {
                                        description: "Error description",
                                        type: "string",
                                        example: error.description
                                    },
                                    extensions: {
                                        type: "object",
                                        properties: {
                                            code: {
                                                description: "Error code",
                                                type: "string",
                                                example: error.code
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return errors;
}

function generateQuery(parentType, field, expandGraph, errorList = [], disableExampleValues = false) {

    const schema = generateExampleSchema(field.name, field.type, expandGraph, 1, disableExampleValues)
    const errors = generateExampleSchemaErrors(errorList);
    const queryResult = generateQueryInternal(
        field,
        expandGraph,
        [],
        1);
    const argStr = queryResult.args
        .filter((item, pos) => queryResult.args.indexOf(item) === pos)
        .map(arg => `$${arg.name}: ${arg.type}`)
        .join(', ');
    var cleanedQuery = queryResult.query.replace(/ : [\w!\[\]]+/g, "");

    var query = `${parentType} ${field.name}${argStr ? `(${argStr})` : ''}{\n${cleanedQuery}}`

    var responseSchema = {
        type: "object",
        properties: {
            data: {
                type: "object",
                properties: {}
            }
        }
    }
    responseSchema.properties.data.properties[field.name] = schema


    return {
        query,
        errors,
        schema: responseSchema,
        args: queryResult.args
    };
}


module.exports = generateQuery
