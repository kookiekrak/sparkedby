"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapAuthenticatedHandler = void 0;
const wrapAuthenticatedHandler = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.wrapAuthenticatedHandler = wrapAuthenticatedHandler;
