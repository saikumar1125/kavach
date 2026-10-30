import fs from 'node:fs';
const KEY = process.env.GNANI_API_KEY;
const lines = [
 'నమస్కారం, నేను సీబీఐ అధికారిని మాట్లాడుతున్నాను. మీ ఆధార్ నంబర్‌తో డ్రగ్స్ పార్సిల్ దొరికింది.',
 'మిమ్మల్ని డిజిటల్ అరెస్ట్ చేశాం. వీడియో కాల్‌లోనే ఉండండి, కాల్ కట్ చేయకండి.',
 'ఈ విషయం ఎవరికీ చెప్పకండి, మీ కుటుంబానికి కూడా చెప్పకండి.',
 'వెరిఫికేషన్ కోసం మీ ఫోన్‌కి వచ్చిన ఓటీపీ వెంటనే చెప్పండి.',
];
const parts = [Buffer.alloc(16000 * 2 * 2)];
for (const text of lines) {
  const r = await fetch('https://api.vachana.ai/api/v1/tts/inference', { method: 'POST', headers: { 'X-API-Key-ID': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: 'Avinash', model: 'timbre-v3.0', language: 'te-IN', audio_config: { sample_rate: 16000, num_channels: 1, sample_width: 2, encoding: 'linear_pcm', container: 'wav' } }) });
  if (!r.ok) throw new Error(r.status + ' ' + await r.text());
  parts.push(Buffer.from(await r.arrayBuffer()).subarray(44), Buffer.alloc(16000 * 2 * 2));
  console.log('ok', text.slice(0, 20));
}
fs.writeFileSync('scammer.pcm', Buffer.concat(parts));
