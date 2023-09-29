import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Socket, io } from "socket.io-client";

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.scss']
})
export class VideoChatComponent implements OnInit, AfterViewInit {
  constructor() { }

  video: MediaStream;
  audio: MediaStream;

  @ViewChild('local_video') localVideo: ElementRef;
  @ViewChild('remote_video') remoteVideo: ElementRef;

  socket: Socket;

  list: MediaDeviceInfo[];
  selectedCam: string;

  ngOnInit(): void {

  }

  print() {

    console.log(this.remoteVideo?.nativeElement?.srcObject);

  }
  ngAfterViewInit(): void {
    this.getCamList();
    this.GetUserAudioMedia()

    this.socket = io("ws://localhost:3000", { transports: ["websocket"] });

    this.socket.connect();

    this.socket.emit('join-room', { roomId: "1234" })

    this.socket.on('JoinedRoom', (data) => {
      console.log(data);

    })

    this.socket.emit('join-room', { roomId: "1234" });

    this.socket.on('ice-candidate', (ice) => {
      const candidate = new RTCIceCandidate(ice.candidate);
      this.peerConnection.addIceCandidate(candidate);
    })

    this.socket.on('offer', (offer) => {

      console.log('handle incoming offer');

      if (!this.peerConnection) {
        this.createPeerConnection();
      }

      this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          this.localVideo.nativeElement.srcObject = this.video;

          this.video.getTracks().forEach(track => {
            try {
              this.peerConnection.addTrack(track, this.video)
            } catch {

            }
          }
          );

        }).then(() => {
          return this.peerConnection.createAnswer();
        }).then((answer) => {
          return this.peerConnection.setLocalDescription(answer);
        }).then(() => {
          this.socket.emit('answer', this.peerConnection.localDescription)
        });
    })

    this.socket.on('answer', (answer) => {
      console.log('handle incoming answer');

      this.peerConnection.setRemoteDescription(answer);
    })
  }

  async getCamList() {
    this.list = (await navigator.mediaDevices.enumerateDevices()).filter(x => x.kind == 'videoinput');

    this.selectedCam = this.list[0].deviceId;
  }

  async GetUserVideoMedia() {
    this.video = await navigator.mediaDevices.getUserMedia({
      video: {
        aspectRatio: 16 / 9,
        deviceId: this.selectedCam
      }
    })
    const tracks = this.video.getTracks();
    for (let track of tracks) {
      track.enabled = true;
    }
  }

  async GetUserAudioMedia() {
    navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true
      }
    }).then(response => {
      this.audio = response;
    }).catch(err => {
      console.error(err);
    })
  }

  async OpenCam() {
    await this.GetUserVideoMedia();
    this.localVideo.nativeElement.srcObject = this.video
  }

  async startVideoCall() {
    this.createPeerConnection();

    this.video.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.video)
    })

    const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer(offerOptions);
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit('offer', offer);
  }

  closeVideoCall() {
    console.log('Closing call');

    if (this.peerConnection) {
      console.log('--> Closing the peer connection');

      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onsignalingstatechange = null;

      // Stop all transceivers on the connection
      this.peerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });

      // Close the peer connection
      this.peerConnection.close();
      this.peerConnection = null;
    }

  };

  private peerConnection: RTCPeerConnection;

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(RTCPeerConfiguration);

    this.peerConnection.onicecandidate = this.handleICECandidateEvent;
    this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.peerConnection.ontrack = this.handleTrackEvent;
  }

  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      this.socket.emit('ice-candidate', { candidate: event.candidate });
    }
  }

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    switch (this.peerConnection.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    switch (this.peerConnection.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    console.log("TRACK", event);

    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }
}

const RTCPeerConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun1.l.google.com:19302'
    }
  ]
}

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};
