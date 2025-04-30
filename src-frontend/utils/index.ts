export const checkWebRTC = () => {
  if (!window.RTCPeerConnection) {
    return false;
  }

  const pc = new RTCPeerConnection();
  const dataCh = 'createDataChannel' in pc;
  pc.close();

  return dataCh;
};

export const formatNumber = (
  x: number,
  unit: string = '',
  power: number = 1000,
) => {
  if (x < power) {
    return `${x.toFixed(1)}${unit}`;
  } else if (x < Math.pow(power, 2)) {
    return `${(x / power).toFixed(1)}K${unit}`;
  } else if (x < Math.pow(power, 3)) {
    return `${(x / Math.pow(power, 2)).toFixed(1)}M${unit}`;
  } else if (x < Math.pow(power, 4)) {
    return `${(x / Math.pow(power, 3)).toFixed(1)}G${unit}`;
  } else {
    return `${(x / Math.pow(power, 3)).toFixed(1)}T${unit}`;
  }
};

export const splitInteger = (x: number) => {
  const [intPart, decPart] = x.toString().split('.');
  const fInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decPart) {
    const fDec = decPart.replace(/(\d{3})/g, '$1,').replace(/,$/, '');
    return `${fInt}.${fDec}`;
  }
  return fInt;
};

export const formatTime = (t: number) => {
  t = Math.trunc(t);
  if (t < 0 || t >= 36000) {
    return '> 100h';
  }

  const sc = t % 60;
  const mn = Math.trunc(t / 60) % 60;
  const hr = Math.trunc(t / 3600);

  return [
    hr > 0 ? `${hr}h` : null,
    hr > 0 || mn > 0 ? `${mn}m` : null,
    `${sc}s`,
  ]
    .filter((v) => v !== null)
    .join(' ');
};
