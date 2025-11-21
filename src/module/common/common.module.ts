
import { CommonController } from "./common.controller";
import { CommonService } from "./common.service";
import { CommonRepository } from "./common.repository";
import { Module } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { HashService } from "src/common/hash.service";
import { AuthService } from "src/auth/auth.service";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports : [LoginDto],
    controllers : [CommonController],
    providers : [
        CommonService, CommonRepository, HashService, AuthService, JwtService],
    exports : [CommonService],
})

export class CommonModule {}