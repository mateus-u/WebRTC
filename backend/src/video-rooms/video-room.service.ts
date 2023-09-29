export class VideoRoom {
    public token: string;
}

export class VideoRoomService {
    private videoRoom: VideoRoom[];

    constructor() {
        this.videoRoom = <VideoRoom[]>[
            {
                token: "1234"
            },
            {
                token: "5678"
            },

        ]
    }

    getVideoRoom(token: string): VideoRoom {
        return this.videoRoom.find(x => x.token == token)
    }
}