/// Update STUN server list
import fs from 'fs';

// Fetch list
const response = await fetch(
  'https://cdn.jsdelivr.net/gh/pradt2/always-online-stun@master/valid_ipv4s.txt'
);
const raw = await response.text();

// Get list
const list = raw
  .split('\n')
  .filter((v) => v.length > 0)
  .map((v) => [...v.split(':')]);

// Get IP regions
const promises = await Promise.allSettled(
  list.map((v) =>
    fetch(`https://api.iplocation.net/?ip=${v[0]}`)
      .then((v) => v.json())
      .then((v) => v.country_code2)
  )
);
const regions = promises.map((v) =>
  v.status === 'fulfilled' ? v.value : 'ZZ'
);

// Sort list
const map = list.reduce((mp, [ip], idx) => {
  mp[ip] = regions[idx];
  return mp;
}, {});
list.sort((a, b) => (map[a[0]] === 'CN' ? -1 : map[a[0]] < map[b[0]] ? -1 : 1));

// Generate new list
const newList = list.map((v) => v.join(':')).join('\n');

// Write file
fs.writeFileSync('src/assets/stun-servers.txt', newList);
