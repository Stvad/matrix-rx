# Matrix-rx

---

A Matrix Chat client library based on RxJS.

The reason d'etre of this library is to provide a developer friendly, extensible interface for
building on Matrix protocol.

## Usage

### Installation

```bash
yarn install matrix-rx
```

### Init client
```typescript
import {Matrix} from 'matrix-rx';


const matrix = await Matrix.fromUserAndPassword({
    userId: "@example:matrix.org",
    password: "password",
    server: "matrix.org"
})
```

### Watch the state of the room (including new messages)

```typescript
import {AugmentedRoomData, AggregatedEvent} from 'matrix-rx'

matrix.room("room_id").subscribe((room: AugmentedRoomData) => {
    // do things with room

    console.log(room.name);

    /**
     * Each message is an Observable in it's own right.
     * It aggregates event relations and emits a new value with the aggregate state
     *
     * E.g. when message is edited or gets reactions, you'll automatically get
     * notified with the new aggregated value
     *
     * */
    room.messages.forEach(messageSubject => {
        messageSubject.subscribe((message: AggregatedEvent) => {
            // do things with message
            console.log(message.content.body);
        })
    })
})
```

### Watch new messages in the room starting from EventId
If you don't care about the state of the room and just want to get notified about new events
and updates to events:

```typescript
matrix.room("room_id", "since eventId").watchEventValues()
    .pipe(filter(it => it.type === 'm.room.message'))
    .subscribe((it: AggregatedEvent) => {
        console.log(it.content.body)
    })
```

### Lower level methods

```typescript
import {SyncResponse} from 'matrix-rx'

matrix.sync().subscribe((syncResponse: SyncResponse) => {
    // if you just want to subscribe to the response of calling /sync indefinitely
})
```

### React components

*These should really be split into a separate package, but I'm waiting to do that when people actually complain about it* 

The components use [Chackra UI](https://chakra-ui.com/getting-started) for styling & theming.

#### Example usages

- You can see me using the above code in the context of the React app in the [src/DemoApp](./src/DemoApp.tsx).
- [Embed Matrix](https://github.com/Stvad/embed-matrix) which allows you to embed Matrix rooms in your website. Is also based on a thin wrapper around this library.

This is currently very much dev focused and not trying to be a full-fledged Matrix client.  
That said you can try the current version of the client assembled from those React components at https://matrix-rx.netlify.app

