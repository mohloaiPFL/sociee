function asyncHandler(handler) {
    return function wrappedHandler(req, res, next) {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

function isValidObjectId(value) {
    return /^[a-f\d]{24}$/i.test(value);
}

module.exports = { asyncHandler, isValidObjectId };
