import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from "express";
import moment from "moment";


@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const error = exception.getResponse() as
            | string
            | { message : string | string[]; error : string; statusCode : number };

        if(typeof error === 'string') {
            response.status(status).json({
                timestamp : moment().format('YYYY-MM-DD HH:mm:ss'),
                success : false,
                statusCode : status,
                path : request.url,
                reason: error
            });
        } else {

            // message가 배열이면 파라미터 validation 에러 (class-validator)
            if (Array.isArray(error.message)) {
                response.status(status).json({
                    timestamp : moment().format('YYYY-MM-DD HH:mm:ss'),
                    success : false,
                    parameter: error.message,  // 배열일 때는 parameter로 변경
                    error: error.error,
                    statusCode: error.statusCode,
                })
            } else {

                // message가 문자열이면 직접 던진 Exception
                response.status(status).json({
                    timestamp : moment().format('YYYY-MM-DD HH:mm:ss'),
                    success : false,
                    reason: error.message,  // 문자열일 때는 reason으로 변경
                    error: error.error,
                    statusCode: error.statusCode,
                })
            }
        }
    }
}