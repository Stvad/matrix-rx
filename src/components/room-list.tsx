import {RoomHierarchyData} from '../matrix/room'

export function RoomList({rooms, setRoomId}: { rooms: RoomHierarchyData[], setRoomId: (roomId: string) => void }) {
    console.log('rlist', {rooms})
    return <div
        css={{
            display: 'flex',
            flexDirection: 'column',
            marginRight: '1em',
        }}
    >
        {rooms?.map(r =>
            <div
                css={{
                    padding: '0.5em',
                }}
                className={'room-list-item button-like'}
                key={r.id}
                onClick={(e) => {
                    e.stopPropagation()
                    setRoomId(r.id)
                }}
            >
                {r?.name || 'DM: ' + r.id}
                {Boolean(r?.children?.length) && <RoomList rooms={r.children} setRoomId={setRoomId}/>}
            </div>)}
    </div>
}
