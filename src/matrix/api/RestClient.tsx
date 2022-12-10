import {
	DefaultErrorHandler,
	ErrorHandlingType,
	SimpleWebRequestBase,
	WebErrorResponse,
	WebRequestOptions,
} from 'simplerestclients'

import {
	AuthParam_,
	DirectorySearch_,
	EmailTokenResponse_,
	EventContext,
	EventsFilter,
	GetJoinedMembersResponse_,
	GetPublicRoomsResponse_,
	GetRoomMembersResponse_,
	LoginParam_,
	LoginResponse_,
	MatrixEvent,
	MessageEventContent,
	NewRoomOptions_,
	PreviewUrl_,
	PusherGetResponse,
	PusherParam,
	PushRuleKind,
	PushRuleScope,
	PushRulesGetResponse,
	StateEventContent,
	StateEventType,
	SyncFilter,
	SyncResponse,
} from '../types/Api'
import {AuthenticatedGenericRestClient} from './AuthenticatedGenericRestClient'
import {PREFIX_REST} from './shared'

const putOptions: WebRequestOptions = {
	retries: 5,
	customErrorHandler(webRequest: SimpleWebRequestBase, errorResponse: WebErrorResponse): ErrorHandlingType {
        // an issue with taking this at face value is that it seems that it's not for the particular request, but for
        // the overall set of them
		// though can be ok, as we can await while pre request is running
		if (errorResponse.statusCode === 429) {
			const retryAfter = errorResponse.body.retry_after_ms
			if (retryAfter) {
				console.log('Got 429, sleeping for', retryAfter, errorResponse)
                setTimeout(() => {
					console.log('retrying ')
                    webRequest.resumeRetrying()
                }, retryAfter)
				return ErrorHandlingType.PauseUntilResumed
			}
		}
		return DefaultErrorHandler(webRequest, errorResponse)
	}
}

export default class RestClient extends AuthenticatedGenericRestClient {
	constructor(accessToken: string, homeServer: string) {
		super(accessToken, homeServer, PREFIX_REST)
	}

	public login(data: LoginParam_): Promise<LoginResponse_> {
		return this.performApiPost<LoginResponse_>('login', data);
	}

	public logout(): Promise<void> {
		return this.performApiPost<void>('logout', {});
	}

	public register(data: {
		auth?: AuthParam_;
		username: string;
		password: string;
		inhibit_login: boolean;
	}): Promise<LoginResponse_> {
		return this.performApiPost<LoginResponse_>('register?kind=user', data);
	}

	public requestEmailToken(data: {
		client_secret: string;
		email: string;
		send_attempt: number;
	}): Promise<EmailTokenResponse_> {
		return this.performApiPost<EmailTokenResponse_>('register/email/requestToken', data);
	}

	public changePassword(data: { auth: LoginParam_; new_password: string }): Promise<unknown> {
		return this.performApiPost<unknown>('account/password', data);
	}

	public deactivateAccount(data: { auth?: LoginParam_ }): Promise<unknown> {
		return this.performApiPost<unknown>('account/deactivate', data);
	}

	public getSyncFiltered(
		syncToken: string,
		filter: SyncFilter,
		syncTimeout: number,
		fullState: boolean
	): Promise<SyncResponse> {
		const filter_ = JSON.stringify(filter);

		return this.performApiGet<SyncResponse>(
			'sync?timeout=' +
				syncTimeout +
				'&filter=' +
				filter_ +
				'&full_state=' +
				fullState +
				'&set_presence=online' +
				(syncToken ? '&since=' + encodeURI(syncToken) : '')
		);
	}

	public getPushers(): Promise<PusherGetResponse> {
		return this.performApiGet<PusherGetResponse>('pushers');
	}

	public setPusher(pusher: PusherParam): Promise<void> {
		return this.performApiPost<void>('pushers/set', pusher);
	}

	public getPushRules(): Promise<PushRulesGetResponse> {
		return this.performApiGet<PushRulesGetResponse>('pushrules/global/')
	}

	public putPushRule(scope: PushRuleScope, kind: PushRuleKind, ruleId: string, body: any): Promise<void> {
		return this.performApiPut<void>(`pushrules/${scope}/${kind}/${ruleId}`, body)
	}

	public deletePushRule(scope: PushRuleScope, kind: PushRuleKind, ruleId: string): Promise<void> {
		return this.performApiDelete<void>(`pushrules/${scope}/${kind}/${ruleId}`)
	}

	public muteRoomNotifications(roomId: string, muted: boolean): Promise<void> {
		const action = muted ? 'dont_notify' : 'notify';

		const content = {
			actions: [action],
		};

		return this.performApiPut<void>('pushrules/global/room/' + roomId, content);
	}

	public sendMessage(roomId: string, messageContent: MessageEventContent, transactionId: string): Promise<void> {
		return this.performApiPut<void>('rooms/' + roomId + '/send/m.room.message/' + transactionId, messageContent);
	}

	public sendStateEvent(
		roomId: string,
		type: StateEventType,
		content: StateEventContent,
		stateKey?: string
	): Promise<void> {
		return this.performApiPut<void>('rooms/' + roomId + '/state/' + type + '/' + stateKey, content, putOptions);
	}

	public sendReadReceipt(roomId: string, eventId: string): Promise<void> {
		const content = {
			'm.fully_read': eventId,
			'm.read': eventId,
		};

		return this.performApiPost<void>('rooms/' + roomId + '/read_markers', content);
	}

	// not used yet
	public sendTyping(roomId: string, userId: string): Promise<void> {
		const data = {
			typing: true,
			timeout: 20000,
		};

		return this.performApiPut<void>('rooms/' + roomId + '/typing/' + userId, data);
	}

	// not used yet
	public setPresence(userId: string): Promise<void> {
		const opts = {
			presence: 'online',
			status_msg: 'online',
		};

		return this.performApiPut<void>('presence/' + userId + '/status', opts);
	}

	public getPresence(userId: string): Promise<{ last_active_ago: number }> {
		return this.performApiGet<{ last_active_ago: number }>('presence/' + userId + '/status');
	}

	public joinRoom(roomId: string): Promise<void> {
		const data = {};

		return this.performApiPost<void>('join/' + roomId, data);
	}

	public leaveRoom(roomId: string): Promise<void> {
		const data = {};

		return this.performApiPost<void>('rooms/' + roomId + '/leave', data);
	}

	public inviteToRoom(roomId: string, userId: string): Promise<void> {
		const data = {
			user_id: userId,
		};

		return this.performApiPost<void>('rooms/' + roomId + '/invite', data);
	}

	public createNewRoom(options: NewRoomOptions_): Promise<{ room_id: string }> {
		return this.performApiPost<{ room_id: string }>('createRoom', options);
	}

	// not used yet
	public inviteToRoomViaEmail(roomId: string, idServer: string, emailAddress: string): Promise<void> {
		const data = {
			id_server: idServer,
			medium: 'email',
			address: emailAddress,
		};

		return this.performApiPost<void>('rooms/' + roomId + '/invite', data);
	}

	// not used yet
	public setRoomTag(userId: string, roomId: string, tag: string): Promise<void> {
		const order = {
			order: 0.1,
		};

		return this.performApiPut<void>('user/' + userId + '/rooms/' + roomId + '/tags/' + tag, order);
	}

	public getPublicRooms(
		options: { limit: number; filter: { generic_search_term: string } },
		server: string
	): Promise<GetPublicRoomsResponse_> {
		return this.performApiPost<GetPublicRoomsResponse_>('publicRooms?server=' + encodeURI(server), options);
	}

	public getRoomMembers(roomId: string): Promise<GetRoomMembersResponse_> {
		return this.performApiGet<GetRoomMembersResponse_>('rooms/' + roomId + '/members');
	}

	public getJoinedRoomMembers(roomId: string): Promise<GetJoinedMembersResponse_> {
		return this.performApiGet<GetJoinedMembersResponse_>('rooms/' + roomId + '/joined_members');
	}

	// not used yet
	public getRoomState(roomId: string): Promise<unknown> {
		return this.performApiGet<unknown>('rooms/' + roomId + '/state');
	}

	public getRoomMessages(
		roomId: string,
		limit: number,
		dir: string,
		from?: string,
		to?: string,
		filter?: { types: string[] }
	): Promise<{ chunk: MatrixEvent[]; end: string }> {
		const filter_ = JSON.stringify(filter);

		return this.performApiGet<{ chunk: MatrixEvent[]; end: string }>(
			'rooms/' +
				roomId +
				'/messages?' +
				'limit=' +
				limit +
				'&dir=' +
				dir +
				(from ? '&from=' + from : '') +
				(to ? '&from=' + to : '') +
				(filter ? '&filter=' + filter_ : '')
		);
	}

	public getMatrixVersions(): Promise<unknown> {
		/*
        this endpoint might get renamed to
        /_matrix/client/info
        and include additional server information
        */

        return this.performApiGet<unknown>('/_matrix/client/versions', {excludeEndpointUrl: true})
	}

	public getHomeserverInfo(): Promise<unknown> {
		return this.performApiGet<unknown>('/_matrix/federation/v1/version', {excludeEndpointUrl: true});
	}

	// not used yet
	public getFilter(userId: string, filterId: string): Promise<unknown> {
		return this.performApiGet<unknown>('user/' + userId + '/filter/' + filterId);
	}

	// not used yet
	public getEvents(roomId: string, from: string, timeout: number): Promise<unknown> {
		return this.performApiGet<unknown>(
			'events?room_id=' + roomId + (from ? '&from=' + from : '') + '&timeout=' + timeout
		);
	}

	// not used yet
	public getTurnServer(): Promise<unknown> {
		return this.performApiGet<unknown>('voip/turnServer');
	}

	public getUserProfile(userId: string): Promise<{ displayname: string; avatar_url: string }> {
		return this.performApiGet<{ displayname: string; avatar_url: string }>('profile/' + userId);
	}

	public get3pid(): Promise<{ threepids: [{ medium: string; address: string }] }> {
		return this.performApiGet<{ threepids: [{ medium: string; address: string }] }>('account/3pid');
	}

	public setProfileDisplayName(userId: string, displayName: string): Promise<void> {
		const data = {
			displayname: displayName,
		};

		return this.performApiPut<void>('profile/' + userId + '/displayname', data);
	}

	public setProfileAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
		const data = {
			avatar_url: avatarUrl,
		};

		return this.performApiPut<void>('profile/' + userId + '/avatar_url', data);
	}

	public getPreviewUrl(url: string): Promise<PreviewUrl_> {
		return this.performApiGet<PreviewUrl_>('preview_url?url=' + url);
	}

	public reportMessage(roomId: string, eventId: string): Promise<void> {
		const data = {
			score: -100,
			reason: 'objectionable / offensive content',
		};

		return this.performApiPost<void>('rooms/' + roomId + '/report/' + eventId, data);
	}

	public redactMessage(roomId: string, eventId: string, transactionId: string): Promise<void> {
		const data = {
			reason: 'N/A',
		};

		return this.performApiPut<void>('rooms/' + roomId + '/redact/' + eventId + '/' + transactionId, data);
	}

	public searchUser(searchTerm: string): Promise<DirectorySearch_> {
		const data = {
			search_term: searchTerm,
			limit: 100,
		};

		return this.performApiPost<DirectorySearch_>('user_directory/search', data);
	}

	public kickMember(roomId: string, userId: string): Promise<void> {
		const data = {
			reason: 'N/A',
			user_id: userId,
		};

		return this.performApiPost<void>('rooms/' + roomId + '/kick', data);
	}

	public getEventContext(
		roomId: string,
		eventId: string,
		{limit, filter}: {limit?: number, filter?: EventsFilter} = {}
	): Promise<EventContext> {
		return this.performApiGet<EventContext>(`rooms/${roomId}/context/${eventId}?` +
			new URLSearchParams({
				...(limit && {limit: limit.toString()}),
				...(filter && {filter: JSON.stringify(filter)})
			}));
	}
}
