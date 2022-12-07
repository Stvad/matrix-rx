import {AuthenticatedGenericRestClient} from './AuthenticatedGenericRestClient'
import {PreviewUrl_} from '../types/Api'
import {PREFIX_MEDIA} from './shared'

export class MediaClient extends AuthenticatedGenericRestClient {
    constructor(accessToken: string, homeServer: string) {
        super(accessToken, homeServer, PREFIX_MEDIA)
    }

    public getPreviewUrl(url: string): Promise<PreviewUrl_> {
        return this.performApiGet<PreviewUrl_>('preview_url?url=' + url)
    }

    public uploadFile(file: File): Promise<{ content_uri: string }> {
        // todo untested
        return this.performApiPost<{ content_uri: string }>('upload?' + new URLSearchParams({
            ...(file.name && {filename: file.name}),
        }), file, {augmentHeaders: {'Content-Type': file.type}})
    }
}
