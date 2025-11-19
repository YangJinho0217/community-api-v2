

export class ApiResponse<T> {
    constructor (
        public message : string,
        public success : boolean,
        public status_code : number,
        public data : T,
    ) {}

    static success<T>(data : T, message : string = "Success") {
        return new ApiResponse(message, true, 200, data);
    }
    
    static message(message : string) {
        return {
            message: message,
            success: true,
            status_code: 200
        };
    }
}

