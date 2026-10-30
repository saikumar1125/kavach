import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { RiskTracker } from './risk.js';

const KEY = process.env.GNANI_API_KEY;
const PORT = Number(process.env.PORT || 3000);
const STT_LANG = process.env.STT_LANG || 'te-IN';
const TTS_VOICE = process.env.TTS_VOICE || 'Suhana';
const TTS_MODEL = process.env.TTS_MODEL || 'timbre-v2.5';
const SAMPLE_RATE = 16000;
const dir = path.dirname(fileURLToPath(import.meta.url));

if (!KEY) { console.error('Set GNANI_API_KEY in .env'); process.exit(1); }

const WARNING_TE = 'ఇది మోసం. వెంటనే కాల్ కట్ చేయండి. ఏ అధికారి కూడా ఓటీపీ అడగరు. మీ కుటుంబ సభ్యులకు చెప్పండి.';

async function synthesize(text) {
  const r = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
    method: 'POST',
    headers: { 'X-API-Key-ID': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text, voice: TTS_VOICE, model: TTS_MODEL, language: 'te-IN', speed: 0.95,
      audio_config: { sample_rate: 24000, num_channels: 1, sample_width: 2, encoding: 'linear_pcm', container: 'wav' },
    }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

const server = http.createServer(async (req, res) => {
  const file = req.url === '/' ? 'index.html' : null;
  if (!file) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(await readFile(path.join(dir, 'public', file)));
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (client) => {
  const risk = new RiskTracker();
  const send = (o) => client.readyState === WebSocket.OPEN && client.send(JSON.stringify(o));
  let stt = null;

  async function handleText(text) {
    const r = risk.feed(text);
    send({ type: 'transcript', text, score: r.score, newSignals: r.newSignals });
    if (r.crossed) {
      try {
        const wav = await synthesize(WARNING_TE);
        send({ type: 'alert', text: WARNING_TE, audio: wav.toString('base64') });
      } catch (e) {
        console.error(e.message);
        send({ type: 'alert', text: WARNING_TE, audio: null, error: e.message });
      }
    }
  }

  function openStt() {
    stt = new WebSocket('wss://api.vachana.ai/stt/v3/stream', {
      headers: {
        'x-api-key-id': KEY, language_code: STT_LANG, model: 'prisma-v2.5',
        'x-sample-rate': String(SAMPLE_RATE), 'x-vad-threshold': '0.6', 'x-min-silence-ms': '600',
        'x-max-speech-s': '15',
      },
    });
    stt.on('open', () => send({ type: 'status', msg: 'Prisma connected' }));
    stt.on('message', (d) => {
      const m = JSON.parse(d.toString());
      if (m.type === 'transcript' && m.text?.trim()) handleText(m.text);
      else if (m.type === 'speech_start') send({ type: 'speech' });
      else if (m.type === 'error') send({ type: 'status', msg: 'STT error: ' + m.message });
    });
    stt.on('unexpected-response', (_q, r) => send({ type: 'status', msg: `STT refused (HTTP ${r.statusCode}) — check API key` }));
    stt.on('error', (e) => send({ type: 'status', msg: 'STT socket error: ' + e.message }));
    stt.on('close', (c) => send({ type: 'status', msg: 'Prisma closed (' + c + ')' }));
  }

  client.on('message', (data, isBinary) => {
    if (isBinary) { if (stt?.readyState === WebSocket.OPEN) stt.send(data, { binary: true }); return; }
    const m = JSON.parse(data.toString());
    if (m.type === 'start') openStt();
    else if (m.type === 'simulate') handleText(String(m.text || ''));
    else if (m.type === 'stop') { stt?.close(); send({ type: 'report', report: risk.report() }); }
  });
  client.on('close', () => stt?.close());
});

server.listen(PORT, () => console.log(`Kavach running at http://localhost:${PORT}`));
