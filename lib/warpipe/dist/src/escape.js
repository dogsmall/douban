"use strict";
const escape = require("escape-html");
exports.escape = escape;
function unescape(html) {
    return String(html)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}
exports.unescape = unescape;
//# sourceMappingURL=escape.js.map