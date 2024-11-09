const colorNameList = require("color-name-list");

module.exports = async function getColorName(hex) {
    const color = colorNameList.find(c => c.hex === hex.toUpperCase());
    return color ? color.name : hex;
}