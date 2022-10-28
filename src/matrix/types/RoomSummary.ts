import { MatrixEvent, RoomPhase, RoomType } from './Api';
import { MessageEvent } from './MessageEvent';
import { User } from './User';

export interface RoomSummary {
	id: string;
	phase: RoomPhase;
	unreadCount: number;
	members: { [id: string]: User };
	timelineEvents: MatrixEvent[]; // raw
	newEvents: MessageEvent[]; // filtered
	active?: boolean;
	type?: RoomType;
	isEncrypted?: boolean;
	name?: string;
	joinMembersCount?: number;
	inviteMembersCount?: number;
	avatarUrl?: string;
	heroes?: string[];
	alias?: string;
	contactId?: string;
	timelineToken?: string;
	timelineLimited?: boolean;
	joinRule?: string;
	readReceipts?: { [id: string]: { eventId: string; timestamp: number } };
	thirdPartyInviteId?: string;
	topic?: string;
	newEventsLimited?: boolean;
	redactedEvents: string[];
}
