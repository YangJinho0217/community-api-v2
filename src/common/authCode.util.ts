/**
 * 6자리 랜덤 인증 코드 생성
 * @returns {Promise<string>} 000000 ~ 999999 형태의 6자리 문자열
 */
export const createAuthCode = async (): Promise<string> => {
    const max = 999999;
    const random_number = Math.floor(Math.random() * max).toString().padStart(6, '0');
    
    return random_number;
}

/**
 * 커스텀 길이의 랜덤 인증 코드 생성
 * @param {number} length 생성할 코드의 길이 (기본값: 6)
 * @returns {Promise<string>} 지정된 길이의 숫자 문자열
 */
export const createAuthCodeWithLength = async (length: number = 6): Promise<string> => {
    const max = Math.pow(10, length) - 1;
    const random_number = Math.floor(Math.random() * max).toString().padStart(length, '0');
    
    return random_number;
}


