import fs from 'node:fs';
const KEY = process.env.GNANI_API_KEY;
const lines = [
 'Scam calls pretending to be police or bank officers trick millions of Indians. Victims only find out after the money is gone, and no tool warns them in their own language. Kavach does.',
 'Step one. Put the call on speaker. The browser listens, and sends tiny slices of audio to a small server that keeps the Gnani key safe.',
 'Step two. Gnani Prisma turns the live Telugu speech into text, even when Telugu and English are mixed, one sentence at a time.',
 'Step three. Kavach checks every sentence for scam signals, like a fake officer, digital arrest, a request for an O T P, or telling you to keep it secret. Each signal pushes the risk meter higher.',
 'Step four. When the risk crosses sixty out of one hundred, Gnani Timbre speaks a calm warning in Telugu, right on the call: this is a scam, cut the call.',
 'Step five. When the call ends, Kavach gives your family a short report, with the verdict and a timeline of what the caller said. Kavach. A shield that listens for you.',
];
const out = [];
for (let i = 0; i < lines.length; i++) {
  const r = await fetch('https://api.vachana.ai/api/v1/tts/inference', { method: 'POST', headers: { 'X-API-Key-ID': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: lines[i], voice: 'Kaveri', model: 'timbre-v2.5', language: 'en-IN', audio_config: { sample_rate: 24000, num_channels: 1, sample_width: 2, encoding: 'linear_pcm', container: 'wav' } }) });
  if (!r.ok) throw new Error(r.status + ' ' + await r.text());
  fs.writeFileSync(`explainer/n${i}.wav`, Buffer.from(await r.arrayBuffer())); console.log('n' + i);
}
