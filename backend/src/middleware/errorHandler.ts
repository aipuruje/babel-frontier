import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    statusCode?: number;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[Error] ${req.method} ${req.path}:`, err);

    res.status(statusCode).json({
        success: false,
        error: message,
        // eslint-disable-next-line no-undef
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export class ValidationError extends Error {
    statusCode = 400;
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends Error {
    statusCode = 401;
    constructor(message: string = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ConflictError extends Error {
    statusCode = 409;
    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}
