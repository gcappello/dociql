const errorDefinitions = {
    "Errors": {
        "type": "object",
        "properties": {
            "errors": {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/Error"
                }
            }
        },
        "required": []
    },
    "Error": {
        "type": "object",
        "properties": {
            "message": {
                "$ref": "#/definitions/String",
                "type": "string"
            },
            "extensions": {
                "$ref": "#/definitions/ErrorExtensions"
            }
        },
        "required": []
    },
    "ErrorExtensions": {
        "type": "object",
        "properties": {
            "code": {
                "$ref": "#/definitions/ErrorCode"
            }
        },
        "required": []
    }
};

module.exports = errorDefinitions;
