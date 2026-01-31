import { Response } from 'express'

export interface ApiResponse<T> {
    code: number
    success: boolean
    message: string
    data: T | null
    errorCode?: string
}

export const success = <T>(data: T, message: string = 'Success'): ApiResponse<T> => {
    return {
        code: 200,
        success: true,
        message,
        data,
    }
}

export const error = (
    message: string,
    code: number = 500,
    errorCode?: string,
    data: any = null
): ApiResponse<any> => {
    return {
        code,
        success: false,
        message,
        data,
        errorCode,
    }
}

export const sendSuccess = <T>(res: Response, data: T, message?: string) => {
    res.status(200).json(success(data, message))
}

export const sendError = (
    res: Response,
    message: string,
    code: number = 500,
    errorCode?: string
) => {
    res.status(code).json(error(message, code, errorCode))
}
