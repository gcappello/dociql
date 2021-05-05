/**
 * Retrieves the example value from the description given an @example tag is provided
 * @param description
 * @returns string | null
 */
module.exports = function(description) {
    let example = null;
    if (description !== null) {
        const match = description.match(/@example:?[\s]*([^\n]*)/);
        if (match !== null) {
            try {
                example = JSON.parse(String(match[1]));

                if (Array.isArray(example) && example.length > 0) {
                    return example.join();
                }
            } catch (e) {
                console.log(
                    '\x1b[43m\x1b[30m[WARNING]',
                    `\`${match[1]}\` is not a valid example. If it's a string, make sure it is surrounded by quotation marks \`"\`.`,
                    '\x1b[0m'
                )
            }
        }
    }

    return example;
}
