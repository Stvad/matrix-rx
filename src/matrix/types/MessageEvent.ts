import { MessageEventContent } from './Api';

export interface MessageEvent {
	eventId: string;
	content: MessageEventContent;
	type: string;
	time: number;
	senderId: string;
	userId?: string;
	previousContent?: MessageEventContent;
	dateChangeFlag?: boolean;
	tempId?: string;
	isRedacted?: boolean;
}
