import {ApiCallOptions, GenericRestClient} from 'simplerestclients'

export class AuthenticatedGenericRestClient extends GenericRestClient {
    constructor(private accessToken: string, homeServer: string, prefix: string) {
        super('https://' + homeServer + prefix)
    }

    protected override _getHeaders(options: ApiCallOptions): { [key: string]: string } {
        const headers = super._getHeaders(options)

        if (this.accessToken) {
            headers['Authorization'] = 'Bearer ' + this.accessToken
        }

        return headers
    }
}
