/**
 * Function to validate embed fields. If name or value fields are not strings, they will be converted to strings.
 * @param {Embed} embed 
 * @returns {Embed}
 */
module.exports = async function validateEmbedFields(embed) {
    if (embed.data.fields) {
        embed.data.fields.forEach(field => {
            if (typeof field.name !== 'string') field.name = String(field.name);
            if (typeof field.value !== 'string') field.value = String(field.value);
        });
    }
    return embed;
}