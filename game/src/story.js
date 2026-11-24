// SUNSET KEYS v4 — story: 14 missions, characters, and 3 endings.
// You are RAY "Kunci" MARLOWE, a getaway driver back in Port Alba after five years
// away. Your sister LENA runs the Marina garage; your old crew-mate DINO owes the
// Kings. The final heist and your turf standing decide which of 3 endings you get.
// All names, places and crews are original.
import { G } from './state.js';

export const CHARACTERS = {
  ray: { name: 'Ray "Kunci" Marlowe', role: 'Kamu — sopir kabur terbaik Port Alba' },
  lena: { name: 'Lena Marlowe', role: 'Adikmu — mekanik Marina, penadah mobil' },
  dino: { name: 'Dino Varga', role: 'Teman lama — utang besar ke Kings' },
  sarge: { name: 'Sersan Kova', role: 'Polisi korup yang memeras kru jalanan' },
  viper: { name: 'SNAKE', role: 'Pemimpin Vipers — penguasa Old Town' },
  king: { name: 'Marco "Raja" Bell', role: 'Bos Kings — penguasa Industrial' },
};

export const MISSIONS = [
  { id: 'm1', title: 'Pulang Kampung', giver: 'lena', pay: 200, level: 1, type: 'goto', x: 900, y: 500, brief: 'Temui Lena di garasi Marina. Jalan kaki atau curi mobil — kotamu lagi.' },
  { id: 'm2', title: 'Kerja Pertama', giver: 'lena', pay: 350, level: 1, type: 'drive', x: 2200, y: 700, brief: 'Antar paket Lena ke Downtown. Jangan sampai mobil rusak parah.' },
  { id: 'm3', title: 'Taksi Kilat', giver: 'dino', pay: 300, level: 1, type: 'taxi', brief: 'Dino butuh sopir taksi darurat: jemput 2 penumpang dan antar tepat waktu.' },
  { id: 'm4', title: 'Utang Dino', giver: 'dino', pay: 500, level: 1, type: 'kill', x: 1300, y: 2100, count: 4, brief: 'Penagih Kings mengepung Dino di Old Town. Bersihkan mereka.' },
  { id: 'm5', title: 'Balapan Sunset', giver: 'lena', pay: 700, level: 2, type: 'race', brief: 'Street race keliling Downtown — lewati 4 checkpoint sebelum waktu habis.' },
  { id: 'm6', title: 'Perang Turf: Old Town', giver: 'viper', pay: 800, level: 2, type: 'turf', district: 'oldtown', count: 6, brief: 'Rebut Old Town dari Vipers: kalahkan 6 anggota geng di wilayah mereka.' },
  { id: 'm7', title: 'Persiapan Heist: Peta', giver: 'lena', pay: 600, level: 2, type: 'goto', x: 4380, y: 620, brief: 'Curi denah kargo bandara dari kantor terminal Alba International.' },
  { id: 'm8', title: 'Heist I — Kargo Bandara', giver: 'lena', pay: 2500, level: 2, type: 'heist', heist: 0, brief: 'Heist pertama: bobol gudang kargo bandara. Pilih pendekatanmu di papan heist.' },
  { id: 'm9', title: 'Vigilante: Jalanan Aman', giver: 'sarge', pay: 650, level: 2, type: 'vigilante', count: 3, brief: 'Sarge memintamu bereskan 3 perampok jalanan — dengan caranya sendiri.' },
  { id: 'm10', title: 'Perang Turf: Industrial', giver: 'king', pay: 900, level: 3, type: 'turf', district: 'industrial', count: 8, brief: 'Kings menantangmu: rebut Industrial. 8 anggota geng menunggumu.' },
  { id: 'm11', title: 'Persiapan Heist: Kru', giver: 'dino', pay: 700, level: 3, type: 'goto', x: 2600, y: 3200, brief: 'Rekrut kru heist di bengkel Turbo — bawa Dino dan satu spesialis.' },
  { id: 'm12', title: 'Heist II — Brankas Pelabuhan', giver: 'lena', pay: 4000, level: 3, type: 'heist', heist: 1, brief: 'Heist kedua: brankas pelabuhan Marina. Uang besar, pengamanan besar.' },
  { id: 'm13', title: 'Terbang Malam', giver: 'lena', pay: 1200, level: 3, type: 'fly', x: 4380, y: 750, brief: 'Terbangkan pesawat kargo dari bandara ke landasan darurat — hindari radar.' },
  { id: 'm14', title: 'Heist Final — Kasino Alba', giver: 'lena', pay: 8000, level: 3, type: 'heist', heist: 2, brief: 'Heist terakhir: Kasino Alba. Pilihanmu di sini menentukan ending cerita.' },
];

export const ENDINGS = [
  { id: 'king', title: 'RAJA PORT ALBA', text: 'Kasino tumbang, turf milikmu, semua kru tunduk. Ray Marlowe kini penguasa Port Alba — tapi harga yang dibayar tidak pernah murah.' },
  { id: 'ghost', title: 'HANTU SUNSET', text: 'Uang dibawa kabur diam-diam sebelum fajar. Tak ada yang tahu ke mana Ray pergi — hanya kunci mobilnya yang tertinggal di dermaga.' },
  { id: 'clean', title: 'JALAN PULANG', text: 'Ray menyerahkan bukti korupsi Sarge, melunasi utang Dino, dan membuka bengkel legal bersama Lena. Port Alba akhirnya jadi rumah.' },
];

/** Ending picked by the final heist approach + turf standing. */
export function pickEnding() {
  const approach = G.heistPlan.approach;
  const turf = G.turf;
  const owned = Object.values(turf).filter((o) => o === 'player').length;
  if (approach === 'LOUD' && owned >= 3) return ENDINGS[0];
  if (approach === 'SNEAK') return ENDINGS[1];
  return ENDINGS[2];
}

/** Mission briefing text for the phone's mission list. */
export function missionBrief(m) {
  const giver = CHARACTERS[m.giver];
  return (giver ? giver.name + ': ' : '') + m.brief;
}
