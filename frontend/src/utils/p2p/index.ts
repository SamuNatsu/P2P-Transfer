/// P2P module
import stunServers from '@/assets/stun-servers.txt?raw';

// Connection count
export const P2P_CONNECTION_COUNT: number = 4;

// Buffer size
export const P2P_BUFFER_SIZE: number = 4194304;

// Packet size
export const P2P_PACKET_SIZE: number = 16384;

// ICE server list
export const P2P_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: stunServers
      .split('\n')
      .map((v: string): string => 'stun:' + v)
      .filter((v: string): boolean => v.length > 0)
  }
];
