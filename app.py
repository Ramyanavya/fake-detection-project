from flask import Flask, render_template, request, jsonify
import re
import math

app = Flask(__name__)

# ─── Scam keyword patterns ───────────────────────────────────────────────────
SCAM_KEYWORDS = [
    "pay to join", "registration fee", "deposit required", "upfront payment",
    "guaranteed job", "100% placement", "assured salary", "instant offer",
    "no interview", "work from home earn", "earn from home", "daily earnings",
    "unlimited income", "passive income", "multi level", "mlm", "pyramid",
    "refer and earn", "send money", "pay first", "advance fee",
    "whatsapp only", "telegram only", "no experience required earn",
    "certificate fee", "training fee", "join fee", "membership fee",
    "verify your account pay", "limited seats hurry", "act now",
    "free internship but pay", "stipend after fee", "fake company",
    "unverified", "no office", "freelance earn daily", "quick money",
    "easy money", "guaranteed certificate", "iso certified fake",
    "google certified scam", "pay for internship", "money back guarantee job"
]

LEGITIMATE_KEYWORDS = [
    "apply on linkedin", "official website", "interview process",
    "hr will contact", "no fees required", "free internship",
    "stipend provided", "verified company", "registered company",
    "experience letter", "letter of recommendation", "nda signed",
    "onboarding process", "background check", "portfolio required",
    "github profile", "technical round", "aptitude test", "coding test",
    "meet the team", "office visit", "glassdoor", "ambitionbox",
    "internshala verified", "legitimate", "equity", "fixed pay"
]

SUSPICIOUS_PATTERNS = [
    r'\b(rs\.?|inr|₹)\s*\d+\s*(fee|deposit|charge|payment)',
    r'pay\s+(rs|inr|₹|\$)\s*\d+',
    r'\d{10}\s*(whatsapp|call|contact)',
    r'(earn|make)\s+(rs|inr|₹|\$)\s*\d+\s*(daily|per day|weekly)',
    r'100\s*%\s*(placement|job|guarantee)',
    r'(no\s+experience|fresher).{0,30}earn',
    r'limited\s+(seats?|offer|time)',
    r'(click|join)\s+(now|today|immediately)',
    r'free\s+(laptop|mobile|iphone)',
    r'work\s+\d+\s+hour',
]


def analyze_text(text):
    text_lower = text.lower()
    score = 0
    flags = []
    positives = []

    # Check scam keywords
    scam_hits = []
    for kw in SCAM_KEYWORDS:
        if kw in text_lower:
            scam_hits.append(kw)
            score += 8
    if scam_hits:
        flags.append(f"Suspicious keywords found: {', '.join(scam_hits[:4])}")

    # Check suspicious regex patterns
    pattern_hits = []
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, text_lower):
            pattern_hits.append(pattern)
            score += 10
    if pattern_hits:
        flags.append(f"{len(pattern_hits)} high-risk pattern(s) detected in text")

    # Check legitimate keywords
    legit_hits = []
    for kw in LEGITIMATE_KEYWORDS:
        if kw in text_lower:
            legit_hits.append(kw)
            score -= 6
    if legit_hits:
        positives.append(f"Legitimate signals: {', '.join(legit_hits[:3])}")

    # Length analysis
    word_count = len(text.split())
    if word_count < 20:
        score += 5
        flags.append("Very short description — lacks detail")
    elif word_count > 80:
        score -= 5
        positives.append("Detailed description provided")

    # Punctuation abuse
    exclamations = text.count('!')
    if exclamations >= 3:
        score += 8
        flags.append(f"Excessive exclamation marks ({exclamations}!) — pressure tactic")

    # ALL CAPS check
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.4:
        score += 7
        flags.append("Excessive capitalization detected")

    # Contact info without website
    has_phone = bool(re.search(r'\b\d{10}\b', text))
    has_url = bool(re.search(r'https?://|www\.', text_lower))
    if has_phone and not has_url:
        score += 6
        flags.append("Phone number present but no official website link")
    if has_url:
        positives.append("Official website/link referenced")

    # Clamp score
    score = max(0, min(100, score))

    # Determine verdict
    if score >= 65:
        verdict = "SCAM"
        verdict_color = "danger"
        advice = "🚨 High risk! Do NOT pay any fees. Report this to cybercrime.gov.in"
    elif score >= 35:
        verdict = "SUSPICIOUS"
        verdict_color = "warning"
        advice = "⚠️ Proceed with caution. Verify the company independently before responding."
    else:
        verdict = "LEGITIMATE"
        verdict_color = "safe"
        advice = "✅ Looks relatively safe. Always verify on official platforms before joining."

    return {
        "score": score,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "advice": advice,
        "flags": flags if flags else ["No major red flags detected"],
        "positives": positives if positives else ["No strong legitimacy signals found"],
        "word_count": word_count,
        "scam_keyword_count": len(scam_hits),
        "pattern_count": len(pattern_hits),
        "legit_keyword_count": len(legit_hits)
    }


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    text = data.get('text', '').strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    result = analyze_text(text)
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)
