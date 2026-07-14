import jsonwebtoken from 'jsonwebtoken';

function generateAccessToken(userId, role) {
    return jsonwebtoken.sign(
        { userId, role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );
}

function generateRefreshToken(userId) {
    return jsonwebtoken.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
}

export { generateAccessToken, generateRefreshToken };