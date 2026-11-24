// story.js — original story: Mara, Dario, the three crews and the three endings.
export const CHARACTERS = {
  mara: { name: 'Mara Voss', role: 'Fixer at the Beach Shack — your first contact in Port Alba.' },
  dario: { name: 'Dario Kell', role: 'Old wheelman who teaches you to drive, fly and sail.' },
  ivy: { name: 'Ivy Chen', role: 'Hacker who plans the heists and cuts the alarms.' },
  rex: { name: 'Rex Marlowe', role: 'Leader of the Vipers — controls Downtown and Portside.' },
  king: { name: 'King Solomon', role: 'Leader of the Kings — holds North Hills.' },
  marina: { name: 'Sofia Marina', role: 'Leader of the Marina Boys — runs the docks.' },
  chief: { name: 'Chief Alden', role: 'APD chief. Bought by Rex — until you prove otherwise.' },
};
export const STORY_BEATS = [
  'You arrive in Port Alba with $500 and a borrowed sedan. Mara Voss needs a driver.',
  'The Vipers tax every street in Downtown. Mara wants their grip broken, district by district.',
  'Dario Kell teaches you the old routes — and how to fly a plane out of Alba International.',
  'Ivy Chen has a plan: three heists, one crew, and a city that will finally be yours.',
];
export const ENDINGS = {
  kingpin: { title: 'KINGPIN OF PORT ALBA', text: 'All six districts fly your flag. The crews pay you now. Port Alba is yours.' },
  clean: { title: 'THE CLEAN GETAWAY', text: 'You take the casino money, burn the evidence and vanish at dawn. Free at last.' },
  peace: { title: 'THE TRUCE', text: 'You broker a truce between the crews and walk away a legend — rich, and alive.' },
};
export function endingFor(approach, turfOwned) {
  if (turfOwned >= 6) return 'kingpin';
  if (approach === 'SNEAK') return 'clean';
  return 'peace';
}
