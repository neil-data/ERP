import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const user_schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password_hash: {
            type: String,
            required: true,
            minlength: 6
        },
        role: {
            type: String,
            enum: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'],
            required: true
        },
        refresh_token: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

user_schema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password_hash);
};

export default mongoose.model('User', user_schema);