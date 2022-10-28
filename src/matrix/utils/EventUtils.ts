import { MessageEvent } from '../types/MessageEvent';
import { MatrixEvent, RoomType } from '../types/Api';
import * as _ from 'lodash';

class EventUtils {
	public filterEvent(event: MatrixEvent, roomType: RoomType): boolean {
		if (!event) {
			return false;
		}

		return (
			Boolean(
				// (event.type === 'm.room.message' && event.content.body)
				event.type === 'm.room.message' ||
					event.type === 'm.room.encrypted' ||
					event.type === 'm.room.third_party_invite' ||
					(event.type === 'm.room.member' && roomType !== 'community') ||
					(event.type === 'm.room.name' &&
						event.unsigned &&
						event.unsigned.prev_content &&
						roomType !== 'notepad') ||
					(event.type === 'm.room.avatar' &&
						event.unsigned &&
						event.unsigned.prev_content &&
						roomType !== 'notepad')
			) &&
			!(
				event.type === 'm.room.member' &&
				event.unsigned &&
				event.unsigned.prev_content &&
				event.unsigned.prev_content.membership === event.content.membership
			)
		);
	}

	public filterRoomEvents(
		timelineEvents: MatrixEvent[],
		roomType: RoomType,
		previousEventTime?: number
	): MessageEvent[] {
		if (!timelineEvents) {
			return [];
		}

		let lastMessageDate: Date;

		if (previousEventTime) {
			lastMessageDate = new Date(previousEventTime);
			lastMessageDate.setHours(0, 0, 0, 0);
		} else {
			lastMessageDate = new Date(); // today
			lastMessageDate.setDate(lastMessageDate.getDate() + 1); // tomorrow
		}

		const timelineEvents_ = timelineEvents
			.filter(event => {
				return this.filterEvent(event, roomType);
			})
			.map(event => {
				const thisMessageDate = new Date(event.origin_server_ts);
				thisMessageDate.setHours(0, 0, 0, 0);
				const dateChangeFlag: boolean = thisMessageDate < lastMessageDate;
				lastMessageDate = thisMessageDate;

				return {
					eventId: event.event_id,
					content: event.content,
					type: event.type,
					time: event.origin_server_ts,
					senderId: event.sender,
					previousContent: event.unsigned ? event.unsigned.prev_content : undefined,
					userId: event.state_key,
					dateChangeFlag: dateChangeFlag,
					tempId: event.unsigned ? event.unsigned.transaction_id : undefined,
					isRedacted: event._redacted || Object.keys(event.content).length === 0,
				};
			});

		// duplicates filter
		return _.uniqBy(timelineEvents_, event => event.eventId);
	}

}

export default new EventUtils();
