var Handlebars = require('handlebars')
var common = require('../lib/common')

module.exports = function (value, options) {
    const query = value.example;
    const variables = value.schema ?
        JSON.stringify(common.formatExample(value, options.data.root, options.hash))
        : null;

    const variablesQuery = variables ? `&variables=${encodeURIComponent(variables)}` : ""

    var url = `${options.data.root.servers[0].url}?query=${encodeURIComponent(query)}${variablesQuery}`;
    return new Handlebars.SafeString(`<a href="${url}" target="_blank">Try it now<a/>\n`);
}