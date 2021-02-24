/**
 * Retrieves the example value from the description given an @example tag is provided
 * @param description
 * @returns string | null
 */
module.exports = function(description) {
    let example = null;
    if (description !== null) {
        const match = description.match(/@example:?[\s]*([^\n]*)/);
        example = match !== null ? match[1] : example;
    }

    return example;
}