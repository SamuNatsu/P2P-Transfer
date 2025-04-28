import rawStunList from "@/assets/stun-servers.txt?raw";
import EventEmitter from "eventemitter3";

/**
 * Events
 *
 * [new candidate](RTCIceCandidate)
 * [offer](RTCSessionDescription)
 * [answer](RTCSessionDescription)
 */

// Export class
export class P2PConnection extends EventEmitter {
  private static stuns: RTCIceServer[] = rawStunList
    .trim()
    .split("\n")
    .map((ip) => ({ urls: `stun:${ip}` }));

  private pc: RTCPeerConnection;

  public constructor() {
    super();

    this.pc = new RTCPeerConnection({
      bundlePolicy: "balanced",
      iceServers: P2PConnection.stuns,
      iceTransportPolicy: "all",
    });
    this.pc.addEventListener("icecandidate", (ev) => {
      if (ev.candidate !== null) {
        this.emit("new candidate", ev.candidate);
      }
    });
    this.pc.addEventListener("connectionstatechange", () => {
      // TODO
    });
  }

  public addCandidate(candidate: RTCIceCandidateInit): void {
    this.pc.addIceCandidate(candidate).catch((err: Error) => {
      console.error(err);
    });
  }

  public createOffer(): void {
    this.pc
      .createOffer()
      .then((offer) => this.pc.setLocalDescription(offer))
      .then(() => {
        this.emit("offer", this.pc.localDescription);
      })
      .catch((err: Error) => {
        this.emit("error", err);
      });
  }

  public createAnswer(desc: RTCSessionDescriptionInit): void {
    this.pc
      .setRemoteDescription(desc)
      .then(() => this.pc.createAnswer())
      .then((answer) => this.pc.setLocalDescription(answer))
      .then(() => {
        this.emit("answer", this.pc.localDescription);
      })
      .catch((err: Error) => {
        this.emit("error", err);
      });
  }

  public setAnswer(desc: RTCSessionDescriptionInit): void {
    this.pc.setRemoteDescription(desc).catch((err: Error) => {
      this.emit("error", err);
    });
  }
}
