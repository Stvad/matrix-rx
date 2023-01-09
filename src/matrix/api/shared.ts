import {LoginResponse_} from '../types/Api'
import {Credentials} from '../types/Credentials'
import {localName} from '../utils'

export const PREFIX_REST = '/_matrix/client/v3/'
export const PREFIX_MEDIA = '/_matrix/media/v3/'

export const loginToCredentials = (login: LoginResponse_): Credentials => ({
    userId: localName(login.user_id),
    userIdFull: login.user_id,
    accessToken: login.access_token,
    deviceId: login.device_id,
    homeServer: login.home_server,
})
