import { WebSocket } from 'ws';
const KEY = process.env.GNANI_API_KEY;
async function tts(text){
  const r = await fetch('https://api.vachana.ai/api/v1/tts/inference',{method:'POST',headers:{'X-API-Key-ID':KEY,'Content-Type':'application/json'},
    body:JSON.stringify({text,voice:'Deepak',model:'timbre-v2.5',language:'hi-IN',audio_config:{sample_rate:16000,num_channels:1,sample_width:2,encoding:'linear_pcm',container:'wav'}})});
  if(!r.ok) throw new Error(r.status+' '+await r.text());
  return Buffer.from(await r.arrayBuffer()).subarray(44);
}
const lines = ['नमस्ते, मैं सीबीआई अधिकारी बोल रहा हूँ। आपका डिजिटल अरेस्ट हो गया है।','अपना ओटीपी तुरंत बताइए और किसी को मत बताना।'];
const parts=[]; for (const l of lines) parts.push(await tts(l), Buffer.alloc(16000*2)); const pcm = Buffer.concat(parts);
console.log('audio seconds', pcm.length/32000);
const ws = new WebSocket('ws://localhost:3000/ws');
ws.on('message', d=>{const m=JSON.parse(d); if(m.audio) m.audio='<wav>'; console.log(JSON.stringify(m));});
await new Promise(r=>ws.on('open',r));
ws.send(JSON.stringify({type:'start'}));
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i+1024<=pcm.length;i+=1024){ ws.send(pcm.subarray(i,i+1024),{binary:true}); await new Promise(r=>setTimeout(r,32)); }
await new Promise(r=>setTimeout(r,15000));
process.exit(0);
