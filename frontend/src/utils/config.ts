/// P2P module
import StunServers from '@/assets/stun-servers.txt?raw';

// Connection count
export const P2P_CONNECTION_COUNT: number = 16;

// ICE server list
export const P2P_ICE_SERVERS: RTCIceServer[] = StunServers.split('\n')
  .filter((v: string): boolean => v.length > 0)
  .map((v: string): RTCIceServer => ({ urls: 'stun:' + v }));
