import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
import jsonwebtoken from 'jsonwebtoken';

// Shared cookie options
const accessCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000 // 15 minutes
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// REGISTER
async function register(req, res) {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields required' });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password_hash: passwordHash, role });
        return res.status(201).json({ message: 'User created', userId: newUser._id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Registration failed' });
    }
}

// LOGIN
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        user.refresh_token = refreshTokenHash;
        await user.save();

        res.cookie('accessToken', accessToken, accessCookieOptions);
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);

        return res.status(200).json({ userId: user._id, role: user.role });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Login failed' });
    }
}

// REFRESH
async function refresh(req, res) {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.status(401).json({ message: 'No refresh token' });
    }
    try {
        const decoded = jsonwebtoken.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user || !user.refresh_token) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const isValid = await bcrypt.compare(token, user.refresh_token);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken(user._id, user.role);
        res.cookie('accessToken', newAccessToken, accessCookieOptions);

        return res.status(200).json({ message: 'Token refreshed' });
    } catch (error) {
        return res.status(401).json({ message: 'Refresh failed, please login again' });
    }
}

// LOGOUT
async function logout(req, res) {
    try {
        const user = await User.findById(req.user.userId);
        if (user) {
            user.refresh_token = null;
            await user.save();
        }
        res.clearCookie('accessToken', accessCookieOptions);
        res.clearCookie('refreshToken', refreshCookieOptions);
        return res.status(200).json({ message: 'Logged out' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Logout failed' });
    }
}

// GET ME
async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.userId).select('-password_hash -refresh_token');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch user' });
    }
}

export { register, login, refresh, logout, getMe };