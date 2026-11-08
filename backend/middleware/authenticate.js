const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
    const authorization = req.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.DEV_JWT_SECRET);
        req.userId = payload.sub;
        return next();
    } catch {
        return res.status(401).json({ message: "Your session is invalid or has expired." });
    }
}

module.exports = authenticate;
