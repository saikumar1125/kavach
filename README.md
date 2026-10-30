# Kavach (కవచ్)

Live scam-call shield for Telugu / Telugu-English calls, built on Gnani Prisma (speech-to-text) and Timbre (text-to-speech).

Put a call on speaker. Kavach streams the audio to Prisma, scores scam signals (fake officials, "digital arrest", OTP and UPI demands, secrecy, urgency) as they pile up, and speaks a Telugu warning through Timbre when risk crosses 60/100. It ends with a report the family can read.

## Run
```
npm install
cp .env.example .env   # add your GNANI_API_KEY
npm start              # http://localhost:3000
npm test               # risk-engine tests
```
Use the "Play scripted scam call" button to demo without a microphone.

## Limits
- The reasoning layer is rule-based pattern matching, not an LLM.
- The Gnani account allows one active API request at a time.
- All demo data is synthetic. No real calls, numbers or IDs are used.
