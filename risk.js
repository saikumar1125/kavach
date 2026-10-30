// Scam-signal engine. Rule-based on purpose: transparent, instant, works offline.
// Patterns cover Telugu script, romanised Telugu/Hindi (how STT often returns code-mixed speech) and English.

export const SIGNALS = [
  {
    id: 'authority', label: 'Claims to be police / CBI / bank / courier', weight: 22,
    re: /(police|cbi|ed officer|customs|narcotics|cyber ?crime|rbi|trai|income ?tax|court|arrest|warrant|inspector|officer|fedex|bank manager|పోలీస్|పోలీసు|సీబీఐ|అధికారి|కోర్టు|అరెస్ట్|వారెంట్|కస్టమ్స్|साइबर|पुलिस|सीबीआई|गिरफ्तार)/i,
    tip: 'అధికారులు ఫోన్‌లో అరెస్ట్ చేయరు',
  },
  {
    id: 'digital_arrest', label: '"Digital arrest" / stay on video call', weight: 30,
    re: /(digital ?arrest|video ?call (lo|pe|par)? ?(undandi|rahiye|raho)|stay on (the )?(line|call)|call (cut|disconnect) ?(cheyakandi|mat)|డిజిటల్ అరెస్ట్|లైన్‌?లోనే ఉండండి|కాల్ కట్ చేయకండి|डिजिटल अरेस्ट)/i,
  },
  {
    id: 'otp', label: 'Asks for OTP / PIN / CVV / password', weight: 35,
    re: /(\botp\b|\bpin\b|\bcvv\b|password|ఓటీపీ|ఓ\.టి\.పి|పిన్|సీవీవీ|పాస్‌వర్డ్|ओटीपी|पिन)/i,
    tip: 'ఎవరికీ OTP చెప్పకండి',
  },
  {
    id: 'payment', label: 'Asks to send money / UPI / transfer', weight: 30,
    re: /(upi|transfer|send (the )?money|pay(ment)? (now|immediately)|gift ?card|bitcoin|rtgs|neft|google ?pay|phonepe|paytm|safe account|verification (fee|amount)|డబ్బు పంపండి|ట్రాన్స్‌ఫర్|యూపీఐ|జమ చేయండి|పేమెంట్|సేఫ్ అకౌంట్|पैसे भेज|ट्रांसफर)/i,
  },
  {
    id: 'kyc', label: 'KYC / account block / SIM block threat', weight: 20,
    re: /(kyc|account (block|freez|suspend|close)|block (avtundi|ayipothundi|hoga)|sim (block|band)|aadhaar|aadhar|pan card|కేవైసీ|బ్లాక్|ఖాతా (బ్లాక్|నిలిపివేత)|ఆధార్|పాన్|केवाईसी|ब्लॉक)/i,
  },
  {
    id: 'urgency', label: 'Extreme urgency / threat', weight: 15,
    re: /(immediately|right now|within (\d+|one|two|thirty) ?(minutes?|hours?)|last chance|urgent|jaldi|ventane|వెంటనే|ఇప్పుడే|త్వరగా|అర్జెంట్|గంటలో|నిమిషాల్లో|तुरंत|अभी|जल्दी)/i,
  },
  {
    id: 'secrecy', label: 'Tells you to keep it secret from family', weight: 28,
    re: /(don'?t tell (anyone|your family)|tell no ?one|keep (it )?(secret|confidential)|evari ?ki+ ?(kuda )?chepp(akandi|akoodadu|akudadu)|family ki (kuda )?chepp(akandi|akoodadu)|ఎవరికీ చెప్పకండి|కుటుంబానికి చెప్పకండి|రహస్యంగా|గోప్యంగా|किसी को (मत )?बताना|किसी को नहीं बताना)/i,
  },
  {
    id: 'remote', label: 'Asks to install an app / screen share', weight: 25,
    re: /(anydesk|teamviewer|quicksupport|screen ?share|install (this )?app|apk|download (the )?app|link (click|ni click)|యాప్ ఇన్‌స్టాల్|డౌన్‌లోడ్ చేయండి|లింక్‌ను క్లిక్|ఎనీడెస్క్)/i,
  },
  {
    id: 'prize', label: 'Prize / lottery / refund bait', weight: 18,
    re: /(lottery|you (have )?won|prize|refund|cashback|reward points|లాటరీ|బహుమతి|గెలుచుకున్నారు|రీఫండ్|इनाम|लॉटरी)/i,
  },
];

export const THRESHOLD = 60;

export class RiskTracker {
  constructor() { this.hits = new Map(); this.score = 0; this.alerted = false; this.log = []; }

  // Returns { score, newSignals, crossed }. Each signal counts once at full weight;
  // repeats add a small bump, so a scammer repeating the OTP demand keeps pushing risk up.
  feed(text) {
    const newSignals = [];
    for (const s of SIGNALS) {
      if (!s.re.test(text)) continue;
      const n = (this.hits.get(s.id) || 0) + 1;
      this.hits.set(s.id, n);
      if (n === 1) newSignals.push({ id: s.id, label: s.label });
    }
    let raw = 0;
    for (const s of SIGNALS) {
      const n = this.hits.get(s.id) || 0;
      if (n) raw += s.weight + Math.min(n - 1, 2) * 4;
    }
    // Combination boost: authority claim + a credential/payment ask is the classic scam shape.
    const h = (id) => this.hits.has(id);
    if (h('authority') && (h('otp') || h('payment'))) raw += 15;
    if (h('secrecy') && (h('otp') || h('payment') || h('digital_arrest'))) raw += 10;
    this.score = Math.min(100, raw);
    const crossed = !this.alerted && this.score >= THRESHOLD;
    if (crossed) this.alerted = true;
    this.log.push({ t: new Date().toISOString(), text, newSignals, score: this.score });
    return { score: this.score, newSignals, crossed };
  }

  report() {
    return {
      finalScore: this.score,
      verdict: this.score >= THRESHOLD ? 'LIKELY SCAM' : this.score >= 30 ? 'SUSPICIOUS' : 'NO CLEAR SCAM SIGNALS',
      signals: SIGNALS.filter((s) => this.hits.has(s.id)).map((s) => ({ id: s.id, label: s.label, times: this.hits.get(s.id) })),
      timeline: this.log,
    };
  }
}
