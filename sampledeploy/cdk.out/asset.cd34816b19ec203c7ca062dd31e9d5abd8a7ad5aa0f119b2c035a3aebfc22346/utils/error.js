"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = handleError;
function handleError(res, error) {
    console.error('Error:', error);
    return res.status(500).json({
        error: error.message || 'An unexpected error occurred'
    });
}
