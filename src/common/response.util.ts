
import moment from "moment";

export class ApiResponse<T> {
    constructor (
        public reason : string,
        public success : boolean,
        public statusCode : number,
        public data : T,
    ) {}

    static success<T>(data : T, reason : string = "Success") {
        return {
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'),
            reason,
            success: true,
            statusCode: 200,
            data
        };
    }
    
    static message(reason : string) {
        return {
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'),
            success: true,
            reason : reason,
            statusCode: 200,
        };
    }
}

