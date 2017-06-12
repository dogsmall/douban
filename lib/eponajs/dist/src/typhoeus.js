"use strict";
const typhoeus_1 = require("typhoeus");
const lodash_1 = require("lodash");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (epona, opts) => {
    epona.throttle = new typhoeus_1.default(lodash_1.defaults(opts, {
        concurrent: 10,
        acquire: (item) => {
            return epona.dispatcher.parse(item.url, ['acquire'])(item);
        },
        release: (args, item) => {
            return epona.dispatcher.parse(item.url, ['release'])(args);
        },
    }));
};
//# sourceMappingURL=typhoeus.js.map