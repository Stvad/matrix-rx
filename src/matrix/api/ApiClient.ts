import RestClient from './RestClient';
export const PREFIX_REST = '/_matrix/client/v3/';
export const PREFIX_MEDIA = '/_matrix/media/v3/';

import {
	PreviewUrl_,
	LoginParam_,
	EmailTokenResponse_,
	LoginResponse_,
	AuthParam_,
	PusherGetResponse,
	NewRoomOptions_,
	LoginParamType,
	RegisterStageType,
	GetPublicRoomsResponse_,
	StateEventContent,
	StateEventType,
	MessageEventContent,
	PusherParam,
	PushRulesGetResponse,
	DirectorySearch_,
	MatrixEvent,
} from '../types/Api';
import { RoomSummary } from '../types/RoomSummary'
import {User} from '../types/User'
import {Credentials} from '../types/Credentials'
import AsyncStorage from '../../core/AsyncStorage'
import {MediaClient} from './MediaClient'

export class ApiClient {
	public credentials!: Credentials;

	public async login(userId: string, password: string, server: string) {
		const restClient = new RestClient('', server);

		const data: LoginParam_ = {
			identifier: {
				type: 'm.id.user',
				user: userId,
			},
			type: 'm.login.password',
			user: userId,
			password: password,
		};

		const response = await restClient.login(data)

		this.credentials = {
			userId: userId,
			userIdFull: response.user_id,
			accessToken: response.access_token,
			deviceId: response.device_id,
			homeServer: server,
		};

		return this.credentials
	}

	public changePassword(
		newPassword: string,
		type?: LoginParamType,
		session?: string,
		oldPassword?: string
	): Promise<unknown> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		let auth: LoginParam_;

		if (session) {
			auth = {
				identifier: {
					type: 'm.id.user',
					user: this.credentials.userIdFull,
				},
				user: this.credentials.userIdFull,
				type: type,
				password: oldPassword,
				session: session,
			};
		}

		const data = {
			auth: auth!,
			new_password: newPassword,
		};

		return restClient.changePassword(data);
	}

	public requestEmailToken(
		server: string,
		clientSecret: string,
		emailAddress: string,
		sendAttempt: number
	): Promise<EmailTokenResponse_> {
		const restClient = new RestClient('', server);

		const data = {
			client_secret: clientSecret,
			email: emailAddress,
			send_attempt: sendAttempt,
		};

		return restClient.requestEmailToken(data);
	}

	public register(
		userId: string,
		password: string,
		server: string,
		type?: RegisterStageType,
		session?: string,
		param?: { sid: string; client_secret: string } | string
	): Promise<LoginResponse_> {
		const restClient = new RestClient('', server);

		let auth: AuthParam_ | undefined;
		if (session) {
			if (type === 'm.login.email.identity' && typeof param !== 'string') {
				auth = {
					type: type,
					threepid_creds: param,
					threepidCreds: param,
					session: session,
				};
			} else {
				auth = {
					type: type!,
					response: param as string,
					session: session,
				};
			}
		}

		const data = {
			auth: auth,
			username: userId,
			password: password,
			inhibit_login: false,
		};

		return restClient.register(data);
	}


	public deleteAccount(type?: LoginParamType, password?: string, session?: string): Promise<unknown> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		let auth: LoginParam_;

		if (session) {
			auth = {
				identifier: {
					type: 'm.id.user',
					user: this.credentials.userIdFull,
				},
				user: this.credentials.userIdFull,
				type: type,
				password: password,
				session: session,
			};
		}

		const data = {
			auth: auth!,
		};

		return restClient.deactivateAccount(data);
	}

	// pushers

	public getPushers(): Promise<PusherGetResponse> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getPushers();
	}

	public setEmailPusher(wantPusher: boolean, emailAddress: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		const pusher: PusherParam = {
			append: false,
			app_display_name: 'Email Notifications',
			app_id: 'm.email',
			device_display_name: emailAddress,
			kind: wantPusher ? 'email' : null,
			pushkey: emailAddress,
			// lang: UiStore.getLanguage(),
			data: {},
		};

		return restClient.setPusher(pusher);
	}

	public muteRoomNotifications(roomId: string, muted: boolean): void {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		restClient.muteRoomNotifications(roomId, muted).catch(_error => null);
	}

	public getPushRules(): Promise<PushRulesGetResponse> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getPushRules();
	}

	// restClient

	public joinRoom(roomId: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.joinRoom(roomId);
	}

	public leaveRoom(roomId: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.leaveRoom(roomId);
	}

	public inviteToRoom(roomId: string, userId: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.inviteToRoom(roomId, userId);
	}

	public createNewRoom(
		type: string,
		name?: string,
		userId?: string,
		alias?: string,
		topic?: string,
		isNotepad?: boolean
	): Promise<{ room_id: string }> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		let options: NewRoomOptions_;
		if (type === 'direct') {
			options = {
				preset: 'private_chat',
				invite: [userId!],
				// invite_3pid: [emailAddress],
				is_direct: true,
			};
		} else if (isNotepad) {
			options = {
				preset: 'private_chat',
				name: name,
				is_direct: false,
				creation_content: {
					is_notepad: true,
				},
			};
		} else if (type === 'group') {
			options = {
				initial_state: [
					{
						type: 'm.room.join_rules',
						state_key: '',
						content: {
							join_rule: 'invite',
						},
					},
					{
						type: 'm.room.history_visibility',
						state_key: '',
						content: {
							history_visibility: 'invited',
						},
					},
					{
						type: 'm.room.guest_access',
						state_key: '',
						content: {
							guest_access: 'forbidden',
						},
					},
				],
				name: name,
				is_direct: false,
			};
		} else if (type === 'community') {
			options = {
				preset: 'public_chat',
				room_alias_name: alias,
				topic: topic,
				name: name,
				visibility: 'public', // makes the community searchable
			};
		}

		return restClient.createNewRoom(options!);
	}

	public getPublicRooms(
		options: { limit: number; filter: { generic_search_term: string } },
		server: string
	): Promise<GetPublicRoomsResponse_> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getPublicRooms(options, server);
	}

	public sendStateEvent(
		roomId: string,
		type: StateEventType,
		content: StateEventContent,
		stateKey?: string
	): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.sendStateEvent(roomId, type, content, stateKey);
	}

	public async getImageEvents(
		roomId: string,
		messageCountAdd: number,
		from: string
	): Promise<{ events: MatrixEvent[]; endToken: string; timelineLimited: boolean }> {
		const filter = {
			types: ['m.room.message'],
			contains_url: true,
		};

		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		const response = await restClient
			.getRoomMessages(roomId, messageCountAdd, 'b', from, '', filter)
			.catch(_error => null);

		if (response) {
			const timelineLimited = messageCountAdd === response.chunk.length;
			const events = response.chunk
				.filter(
					event =>
						event.type === 'm.room.message' &&
						event.content &&
						event.content.msgtype === 'm.image' &&
						event.content.url
				)
				.sort((a, b) => b.origin_server_ts - a.origin_server_ts);
			return Promise.resolve({ events: events, endToken: response.end, timelineLimited: timelineLimited });
		} else {
			return Promise.resolve({ events: [], endToken: '', timelineLimited: false });
		}
	}

	public sendReadReceipt(roomId: string, eventId: string): Promise<void> {
		// if (UiStore.getOffline()) {
		// 	return Promise.resolve();
		// }

		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.sendReadReceipt(roomId, eventId);
	}

	public async getRoomMembers(roomId: string, onlyJoined: boolean): Promise<{ [id: string]: User }> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		const members: { [id: string]: User } = {};

		if (onlyJoined) {
			const response = await restClient.getJoinedRoomMembers(roomId).catch(error => {
				return Promise.reject(error);
			});

			for (const memberId in response.joined) {
				members[memberId] = {
					id: memberId,
					name: response.joined[memberId].display_name,
					avatarUrl: response.joined[memberId].avatar_url,
					membership: 'join',
				};
			}

			return members;
		} else {
			const response = await restClient.getRoomMembers(roomId).catch(error => {
				return Promise.reject(error);
			});

			response.chunk.map(member => {
				members[member.state_key] = {
					id: member.state_key,
					name: member.content.displayname,
					avatarUrl: member.content.avatar_url,
					membership: member.content.membership,
				};
			});

			return members;
		}
	}

	public sendMessage(roomId: string, messageContent: MessageEventContent, tempId: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.sendMessage(roomId, messageContent, tempId);
	}

	public getPreviewUrl(url: string): Promise<PreviewUrl_> {
		const restClient = new MediaClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getPreviewUrl(url)!;
	}

	public getUserProfile(userId: string): Promise<{ displayname: string; avatar_url: string }> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getUserProfile(userId);
	}

	public get3pid(): Promise<{ threepids: [{ medium: string; address: string }] }> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.get3pid();
	}

	public setProfileDisplayName(userId: string, displayName: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.setProfileDisplayName(userId, displayName);
	}

	public setProfileAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.setProfileAvatarUrl(userId, avatarUrl);
	}

	public getPresence(userId: string): Promise<{ last_active_ago: number }> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getPresence(userId);
	}

	public getMatrixVersions(): Promise<unknown> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getMatrixVersions();
	}

	public getHomeserverInfo(): Promise<unknown> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.getHomeserverInfo();
	}

	public reportMessage(roomId: string, eventId: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.reportMessage(roomId, eventId);
	}

	public redactMessage(roomId: string, eventId: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		const transactionId = 'redact' + Date.now();

		return restClient.redactMessage(roomId, eventId, transactionId);
	}

	public searchUser(searchTerm: string): Promise<DirectorySearch_> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.searchUser(searchTerm);
	}

	public kickMember(roomId: string, userId: string): Promise<void> {
		const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer);

		return restClient.kickMember(roomId, userId);
	}

	public restoreDataStore(): Promise<[void, void]> {
		const restoreRoomSummary = async function (): Promise<void> {
			const response = await AsyncStorage.getItem('roomSummaryList').catch(error => {
				return Promise.reject(error);
			});

			const roomSummaryList = JSON.parse(response!) as RoomSummary[];

			if (roomSummaryList.length === 0) {
				return Promise.reject('roomSummaryList empty');
			}

			// DataStore.setRoomSummaryListFromStorage(roomSummaryList);

			return Promise.resolve();
		};

		const restoreLastSeenTime = async function (): Promise<void> {
			const response = await AsyncStorage.getItem('lastSeenTime').catch(error => {
				return Promise.reject(error);
			});

			const lastSeenTime = JSON.parse(response!) as { [id: string]: number };

			// DataStore.setLastSeenTimeFromStorage(lastSeenTime);

			return Promise.resolve();
		};

		return Promise.all([restoreRoomSummary(), restoreLastSeenTime()]);
	}

	public async clearDataStore() {
		await AsyncStorage.removeItem('roomSummaryList');
		await AsyncStorage.removeItem('syncToken');
	}

	public async clearStorage() {
		await AsyncStorage.clear();

		// if (UiStore.getIsElectron()) {
		// 	const { webFrame } = window.require('electron');
		// 	const currentZoomFactor = webFrame.getZoomFactor();
		// 	this.storeZoomFactor(currentZoomFactor);
		// }
	}

	public async getStoredCredentials(): Promise<Credentials | undefined> {
		const credentials = await AsyncStorage.getItem('credentials');

		if (credentials) {
			this.credentials = JSON.parse(credentials) as Credentials;
			return Promise.resolve(this.credentials);
		} else {
			return Promise.resolve(undefined);
		}
	}

	public async storeLastUserId(): Promise<void> {
		await AsyncStorage.setItem('lastUserId', this.credentials.userIdFull);
	}

	public async getStoredLastUserId(): Promise<string | undefined> {
		const lastUserId = await AsyncStorage.getItem('lastUserId');

		return Promise.resolve(lastUserId ? lastUserId : undefined);
	}
}

export default new ApiClient();
