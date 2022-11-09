// move this somewhere else
export type RoomType = 'direct' | 'group' | 'community' | 'notepad';

export type RoomPhase = 'join' | 'invite' | 'leave';
export type LoginIdentifierType = 'm.id.user' | 'm.id.thirdparty' | 'm.id.phone';
export type LoginParamType = 'm.login.password' | 'm.login.token';
export type RegisterStageType = 'm.login.recaptcha' | 'm.login.terms' | 'm.login.dummy' | 'm.login.email.identity';
export type StateEventType = 'm.room.avatar' | 'm.room.name' |
	'matrix-rx.autocomplete'; // todo non-spec
export type SpaceRelationType = 'm.space.child' | 'm.space.parent';
export type MessageEventType =
	| StateEventType
	| SpaceRelationType
	| 'm.room.third_party_invite'
	| 'm.room.redaction'
	| 'm.room.message'
	| 'm.room.member'
	| 'm.room.canonical_alias'
	| 'm.room.join_rules'
	| 'm.room.power_levels'
	| 'm.room.topic'
	| 'm.room.encrypted'
	| 'm.room.create'
	| 'm.receipt'
	| 'm.direct'
	| 'm.push_rules'
	| 'm.presence';

export type EphemeralEventType = 'm.receipt';

export interface LoginParam_ {
	user: string;
	identifier: {
		type: LoginIdentifierType;
		user: string;
	};
	type?: LoginParamType;
	password?: string;
	session?: string;
}

export interface LoginResponse_ {
	user_id: string;
	access_token: string;
	device_id: string;
	home_server: string;
}

export interface AuthParam_ {
	type: RegisterStageType;
	session?: string;
	response?: string; // captcha token
	threepid_creds?: { sid: string; client_secret: string };
	threepidCreds?: { sid: string; client_secret: string };
}

export interface LinkPreview_ {
	url: string;
	text?: string;
	image_url?: string;
	image_width?: number;
	image_height?: number;
	title?: string;
	site_name?: string;
}

export interface PreviewUrl_ {
	'og:image': string;
	'og:image:width': number;
	'og:image:height': number;
	'og:title': string;
	'og:site_name': string;
}

export interface MatrixEvent {
	event_id: string;
	content: MessageEventContent;
	type: MessageEventType;
	origin_server_ts: number;
	sender: string;
	state_key?: string;
	unsigned?: { prev_content: MessageEventContent; transaction_id: string; membership: RoomPhase };
	redacts?: string;
	_redacted?: boolean;
}

export interface RoomNameEvent extends MatrixEvent {
	type: 'm.room.name'
	content: { name: string }
}


export interface ReplaceEvent extends MatrixEvent {
	type: 'm.room.message';
	content: {
		body: string;
		'm.new_content': {
			body: string;
		}
		'm.relates_to': {
			event_id: string;
			rel_type: 'm.replace';
		}
	}
}

export interface ThumbnailInfo_ {
	mimetype: string;
	size: number;
	h: number;
	w: number;
}

export interface MessageEventContentInfo_ {
	mimetype?: string;
	size?: number;
	h?: number;
	w?: number;
	thumbnail_url?: string;
	thumbnail_info?: ThumbnailInfo_;
}

export interface MessageEventContent {
	msgtype?: string;
	body?: string;
	info?: MessageEventContentInfo_;
	url?: string;
	membership?: RoomPhase;
	'm.relates_to'?: {
		event_id?: string;
		is_falling_back?: boolean;
		rel_type?: string;
		'm.in_reply_to'?: { [event_id: string]: string };
	};
	name?: string;
	alias?: string;
	join_rule?: string;
	topic?: string;
	display_name?: string;
	displayname?: string;
	avatar_url?: string;
	is_direct?: boolean;
	third_party_signed?: string;
	last_active_ago?: number;
	users?: { [id: string]: number };
	is_notepad?: string; // custom field
	jitsi_started?: boolean; // custom field
	url_preview?: LinkPreview_; // custom field
}

export interface PusherParam {
	append?: boolean;
	app_display_name?: string;
	app_id: string;
	data: {
		url?: string;
		lang?: string;
		format?: string;
	};
	device_display_name?: string;
	kind: string | null;
	lang?: string;
	profile_tag?: string;
	pushkey: string;
}

export interface PusherGetResponse {
	pushers: {
		app_id: string;
		pushkey: string;
	}[];
}

export type PushRuleKind = 'override' | 'underride' | 'sender' | 'room' | 'content';
export type PushRuleAction = 'notify' | 'dont_notify' | 'coalesce';
export type PushRuleScope = 'global' | 'device';

export interface PushRulesGetResponse {
	content: {
		actions: string[];
		default: boolean;
		enabled: boolean;
		pattern: string;
		rule_id: string;
	}[];
	override: {
		actions: string[];
		conditions: {
			key: string;
			kind: string;
			pattern: string;
		}[];
		default: boolean;
		enabled: boolean;
		rule_id: string;
	}[];
	underride: {
		actions: string[];
		conditions: {
			key: string;
			kind: string;
			pattern: string;
		}[];
		default: boolean;
		enabled: boolean;
		rule_id: string;
	}[];
	room: {
		actions: string[];
		default: boolean;
		enabled: boolean;
		rule_id: string;
	}[];
	sender: [];
}

export interface AuthResponse_ {
	statusCode: number;
	body: {
		session: string;
		flows: { stages: string[] }[];
	};
}

export interface EmailTokenResponse_ {
	submit_url: string;
	sid: string; // session ID
}

export interface ErrorResponse {
	statusCode: number;
	statusText?: string;
	body: {
		errcode?: string;
		error?: string;
	};
}

export interface ErrorRegisterResponse_ {
	statusCode: number;
	body: {
		errcode: string;
		session: string;
		params: {
			'm.login.recaptcha': { public_key: string };
		};
		flows: {
			stages: string[];
		}[];
		completed: string[];
	};
}

export interface NewRoomOptions_ {
	preset?: 'private_chat' | 'public_chat';
	invite?: string[];
	is_direct?: boolean;
	name?: string;
	visibility?: 'public';
	room_alias_name?: string;
	topic?: string;
	invite_3pid?: string[];
	initial_state?: {
		type: 'm.room.join_rules' | 'm.room.history_visibility' | 'm.room.guest_access';
		state_key: string;
		content: {
			join_rule?: 'public' | 'invite';
			history_visibility?: 'invited' | 'world_readable';
			guest_access?: 'forbidden';
		};
	}[];
	creation_content?: { is_notepad: boolean };
}

export interface PublicRoom_ {
	room_id: string;
	aliases: string[];
	avatar_url: string;
	canonical_alias: string;
	name: string;
	topic: string;
	guest_can_join: boolean;
	world_readable: boolean;
	num_joined_members: number;
}

export interface GetPublicRoomsResponse_ {
	chunk: PublicRoom_[];
}

export interface RoomMessagesResponse {
	start: string
	end: string
	chunk: MatrixEvent[]
}

export interface StateEventContent {
	name?: string;
	url?: string;
	size?: number;
	mimetype?: string;
}

export interface StateEvent {
	type: StateEventType;
	content: any;
	stateKey?: string;
}

export interface GetJoinedMembersResponse_ {
	joined: {
		[id: string]: {
			display_name: string;
			avatar_url: string;
		};
	};
}

export interface GetRoomMembersResponse_ {
	chunk: {
		state_key: string;
		sender: string;
		user_id: string;
		room_id: string;
		type: string;
		content: {
			displayname: string;
			avatar_url: string;
			membership: RoomPhase;
		};
	}[];
}

export interface EventsFilter {
	types: MessageEventType[];
	lazy_load_members?: boolean;
	limit?: number;
}

export interface RoomFilter {
	timeline: EventsFilter;
	state: EventsFilter;
	ephemeral: EventsFilter;
	account_data: EventsFilter;
	include_leave: boolean;
	rooms?: string[];
}

export interface SyncFilter {
	room: RoomFilter;
	account_data: EventsFilter;
	presence: EventsFilter;
}

export interface RoomSummary {
	'm.joined_member_count': number;
	'm.invited_member_count': number;
	'm.heroes': string[];
}

export interface RoomTimeline {
	events: MatrixEvent[];
	limited: boolean;
	prev_batch: string;
}

export interface DirectorySearch_ {
	limited: boolean;
	results: {
		user_id: string;
		display_name: string;
		avatar_url: string;
	}[];
}

export interface EphemeralEvent {
	events: {
		type: EphemeralEventType;
		content: {
			[id: string]: {
				'm.read': {
					[id: string]: {
						ts: number;
					};
				};
			};
		};
	}[];
}

export interface RoomData {
	state: {
		events: MatrixEvent[];
	};
	invite_state: {
		events: MatrixEvent[];
	};
	summary: RoomSummary;
	ephemeral: EphemeralEvent;
	timeline: RoomTimeline;
	unread_notifications: {
		notification_count: number;
	};
}

export interface SyncResponse {
	next_batch?: string;
	account_data?: {
		events: {
			type: MessageEventType;
			content: { [id: string]: string[] };
		}[];
	};
	rooms?: {
		invite: { [id: string]: RoomData };
		join: { [id: string]: RoomData };
		leave: { [id: string]: RoomData };
	};
	presence?: {
		events: MatrixEvent[];
	};
}

