
import jsonwebtoken from 'jsonwebtoken';

function verifyToken(req, res, next) {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
        const decoded = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = { userId: decoded.userId, role: decoded.role };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}
export { verifyToken, requireRole };
