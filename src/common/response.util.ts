
import moment from "moment";

export class ApiResponse<T> {
    constructor (
        public reason : string,
        public success : boolean,
        public statsCode : number,
        public data : T,
    ) {}

    static success<T>(data : T, reason : string = "Success") {
        return new ApiResponse(reason, true, 200, data);
    }
    
    static message(reason : string) {
        return {
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'),
            success: true,
            reason : reason,
            statsCode: 200,
            
        };
    }
}

