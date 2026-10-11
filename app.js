const FALLBACK_CATALOG = [
  { id: "salicylic_body_wash", name: "1% Salicylic Acid Body Wash", shortName: "Salicylic Acid Body Wash", category: "body_wash", purpose: ["body acne", "rough or bumpy skin", "back bumps"], keyActive: "1% Salicylic Acid", fragrance: "Scented", suitableFor: ["oily skin", "body acne", "bumpy skin"], cautions: ["Avoid broken skin", "Avoid if severe stinging occurs"], usage: "Massage onto wet skin on concern areas. Leave for 1–2 minutes, then rinse thoroughly.", accent: "blue" },
  { id: "gentle_body_wash", name: "Gentle Daily Body Wash", shortName: "Gentle Daily Body Wash", category: "body_wash", purpose: ["sensitive skin", "gentle cleansing", "dry skin"], keyActive: "Niacinamide + Ceramides", fragrance: "Unscented", suitableFor: ["sensitive skin", "dry skin", "fragrance sensitivity"], cautions: ["For external use only"], usage: "Lather onto wet skin daily and rinse off gently.", accent: "lavender" },
  { id: "aha_roll_on", name: "3% AHA Roll-On Deodorant", shortName: "3% AHA Roll-On", category: "roll_on", purpose: ["underarm odour", "sweat", "dark patches"], keyActive: "3% Mandelic + Lactic Acid", fragrance: "Scented", suitableFor: ["underarm odour", "dark patches"], cautions: ["Do not use right after shaving or waxing", "Stop use if irritation develops"], usage: "Apply on clean, dry underarms. Avoid broken or freshly shaven skin.", accent: "coral" },
  { id: "sensitive_roll_on", name: "Sensitive Care Roll-On", shortName: "Sensitive Care Roll-On", category: "roll_on", purpose: ["underarm odour", "sensitive underarms", "post-shave care"], keyActive: "Aloe Vera + Bisabolol", fragrance: "Unscented", suitableFor: ["sensitive skin", "post-shave care", "odour control"], cautions: ["For external use only"], usage: "Roll gently onto clean, dry underarms.", accent: "green" }
];

const state = { catalog: FALLBACK_CATALOG, screen: "home", selectedProduct: null, concern: "", answers: {}, messages: [], questionIndex: 0, isListening: false, redFlag: "", transcript: "" };
const app = document.querySelector("#app");
let recognition;

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
const titleCase = value => value.replace(/\b\w/g, letter => letter.toUpperCase());
const productOrb = product => `<span class="product-orb ${product.accent === "blue" ? "" : product.accent}" aria-hidden="true"></span>`;
const productVisual = product => `<div class="product-visual ${product.accent === "blue" ? "" : product.accent}" aria-hidden="true"></div>`;
const normalize = value => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

async function loadCatalog() {
  try {
    const response = await fetch("catalog.json");
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.products) && data.products.length) state.catalog = data.products;
    }
  } catch (error) {
    state.catalog = FALLBACK_CATALOG;
  }
  render();
}

function reset() {
  Object.assign(state, { screen: "home", selectedProduct: null, concern: "", answers: {}, messages: [], questionIndex: 0, isListening: false, redFlag: "", transcript: "" });
  if (recognition) recognition.abort();
  render();
}

function render() {
  const views = { home: renderHome, product: renderProductSearch, concern: renderConcern, chat: renderChat, outcome: renderOutcome, report: renderReport };
  app.innerHTML = views[state.screen]();
  attachScreenEvents();
}

function renderHome() {
  return `<section class="screen card home-screen">
    <p class="eyebrow">A calmer way to choose body care</p>
    <h1 class="hero-title">Find care that feels right for <em>your</em> skin.</h1>
    <p class="hero-copy">Answer a few quick questions and get a product fit check from the Bodywise body wash and roll-on range.</p>
    <div class="home-options">
      <button class="path-card" data-action="product-path" type="button"><span class="path-icon">⌕</span><span class="path-kicker">I know what I want</span><h2>I have a product in mind</h2><p>See if a specific product suits your skin, routine, and concern.</p><span class="path-arrow">Check product fit&nbsp; →</span></button>
      <button class="path-card alt" data-action="concern-path" type="button"><span class="path-icon">✦</span><span class="path-kicker">Help me choose</span><h2>I’m not sure yet</h2><p>Start with a concern and we’ll guide you to the closest fit.</p><span class="path-arrow">Explore my concern&nbsp; →</span></button>
    </div>
    <div class="trust-row"><span>No account needed</span><span>Works offline</span><span>Tap or type your answers</span></div>
  </section>`;
}

function renderProductSearch() {
  return `<section class="screen card"><button class="back" data-action="back-home" type="button">← Back to start</button><h1 class="section-title">Which product are you considering?</h1><p class="section-copy">Search the supported Bodywise range. We’ll check the fit before recommending it.</p><div class="search-wrap"><input class="search-input" id="product-search" autocomplete="off" placeholder="Try “salicylic body wash” or “roll-on”" autofocus /><div class="product-results" id="product-results">${state.catalog.map(productResult).join("")}</div></div><p class="disclaimer">This guide supports only the four products shown. If you’re considering another product, choose a concern instead.</p></section>`;
}

function productResult(product) {
  return `<button type="button" class="result" data-product="${product.id}">${productOrb(product)}<span><b>${escapeHtml(product.name)}</b><small>${escapeHtml(product.keyActive)} · ${escapeHtml(product.fragrance)}</small></span></button>`;
}

function renderConcern() {
  const concerns = ["Body acne or back bumps", "Rough or bumpy skin", "Underarm odour or sweat", "Underarm dark patches", "Sensitive or dry skin"];
  return `<section class="screen card"><button class="back" data-action="back-home" type="button">← Back to start</button><h1 class="section-title">What would you like help with?</h1><p class="section-copy">Pick the closest concern, or explain in your own words. The guide stays within body wash and roll-on care.</p><div class="chips" id="concern-chips">${concerns.map(concern => `<button type="button" class="chip" data-concern="${concern}">${concern}</button>`).join("")}</div><label class="field-label" for="custom-concern">Or describe it briefly</label><div class="free-entry"><input class="search-input" id="custom-concern" placeholder="e.g. itchy bumps on my back" /><button class="next-button" id="custom-concern-next" type="button">Continue</button></div><p class="disclaimer">For urgent or severe symptoms, seek professional care instead of relying on product guidance.</p></section>`;
}

function chooseConcern(value) {
  state.concern = value;
  const safety = detectSafety(value);
  if (safety) { state.redFlag = safety; state.screen = "report"; render(); return; }
  state.selectedProduct = suggestProduct(value);
  beginConversation();
}

function suggestProduct(concern) {
  const text = normalize(concern);
  if (/(odou|odor|sweat|underarm|armpit|dark patch|darkness)/.test(text)) return state.catalog.find(product => product.id === "aha_roll_on") || state.catalog[2];
  if (/(sensitive|dry|itch|irritat|khujli|jalan|allerg)/.test(text)) return state.catalog.find(product => product.id === "gentle_body_wash") || state.catalog[1];
  return state.catalog.find(product => product.id === "salicylic_body_wash") || state.catalog[0];
}

function getQuestions(product) {
  const common = [
    { id: "sensitivity", ask: "Do scented products ever make your skin feel itchy, stingy, or irritated?", chips: ["Yes, often", "Sometimes", "No, never", "Not sure"] },
    { id: "skin_state", ask: "Is the skin intact today, without open cuts, bleeding, or a painful rash?", chips: ["Yes, it’s intact", "No, it’s broken", "Not sure"] }
  ];
  if (product.category === "roll_on") return [
    { id: "goal", ask: "What matters most right now?", chips: ["Odour control", "Sweat control", "Dark patches", "A mix of these"] },
    { id: "hair_removal", ask: "Have you shaved or waxed your underarms in the last 24 hours?", chips: ["Yes", "No", "Not sure"] },
    { id: "past_reaction", ask: "Have roll-ons or deodorants caused burning, a rash, or darkening before?", chips: ["Yes", "A little irritation", "No", "Not sure"] },
    common[0], common[1]
  ];
  return [
    { id: "goal", ask: "What are you hoping to improve most?", chips: ["Body acne or bumps", "Rough texture", "Just daily cleansing", "A mix of these"] },
    { id: "dryness", ask: "How does your skin usually feel after a shower?", chips: ["Comfortable", "A little dry", "Tight or itchy", "Not sure"] },
    common[0], common[1]
  ];
}

function beginConversation() {
  const product = state.selectedProduct;
  state.answers = {};
  state.questionIndex = 0;
  state.messages = [{ role: "bot", text: state.concern ? `Thanks — I’ll help you look at ${product.shortName} for “${state.concern}.” A few short questions will help me check the fit.` : `Let’s check whether ${product.shortName} fits your routine. A few short questions will help me check the fit.` }];
  state.screen = "chat";
  render();
}

function renderChat() {
  const questions = getQuestions(state.selectedProduct);
  const question = questions[state.questionIndex];
  const progress = Math.round((state.questionIndex / questions.length) * 100);
  return `<section class="screen card chat-card"><div class="chat-head"><div class="bot-status"><div class="bot-avatar">b</div><span><b>Bodywise Guide</b><small>Private, guided product check</small></span></div><span class="progress-label">${state.questionIndex + 1} of ${questions.length}</span></div><div class="progress-line"><span style="width:${progress}%"></span></div><div class="messages" id="messages">${state.messages.map(message => `<div class="message ${message.role}">${message.role === "bot" ? '<span class="bot-mini">b</span>' : ""}<div class="bubble">${escapeHtml(message.text)}</div></div>`).join("")}<div class="message bot"><span class="bot-mini">b</span><div class="bubble">${escapeHtml(question.ask)}</div></div></div><div class="answer-area"><p class="question-caption">Choose an answer or type your own</p><div class="answer-chips">${question.chips.map(answer => `<button class="answer-chip" type="button" data-answer="${escapeHtml(answer)}">${escapeHtml(answer)}</button>`).join("")}</div><div class="composer"><input class="composer-input" id="answer-input" placeholder="Type an answer..." /><button class="voice-button ${state.isListening ? "listening" : ""}" data-action="voice" type="button" aria-label="Answer with voice">◉</button><button class="send-button" data-action="send-answer" type="button" aria-label="Send answer">↑</button></div><p class="voice-note" id="voice-note">Voice input is optional and stays in your browser. ${voiceSupported() ? "" : '<span class="error-note">Voice input isn’t supported by this browser.</span>'}</p><button type="button" class="unknown-button" data-action="unknown">I’m not sure</button></div></section>`;
}

function answerQuestion(answer) {
  const questions = getQuestions(state.selectedProduct);
  const question = questions[state.questionIndex];
  if (!answer.trim()) return;
  const safety = detectSafety(answer);
  state.messages.push({ role: "user", text: answer });
  if (safety) { state.redFlag = safety; state.transcript = state.messages.map(message => `${message.role}: ${message.text}`).join("\n"); state.screen = "report"; render(); return; }
  state.answers[question.id] = answer;
  state.questionIndex += 1;
  if (state.questionIndex >= questions.length) { state.transcript = state.messages.map(message => `${message.role}: ${message.text}`).join("\n"); state.screen = "outcome"; render(); return; }
  const acknowledgement = acknowledgementFor(question.id, answer);
  if (acknowledgement) state.messages.push({ role: "bot", text: acknowledgement });
  render();
  requestAnimationFrame(() => { const messages = document.querySelector("#messages"); if (messages) messages.scrollTop = messages.scrollHeight; });
}

function acknowledgementFor(id, answer) {
  const text = normalize(answer);
  if (id === "sensitivity" && /yes|sometimes|itch|sting|irritat|khujli|jalan/.test(text)) return "Thanks for sharing that — I’ll factor fragrance sensitivity into the recommendation.";
  if (id === "hair_removal" && /^yes/.test(text)) return "Got it. Freshly shaved or waxed skin needs a gentler approach.";
  return "Got it — thank you.";
}

function detectSafety(value) {
  const text = normalize(value);
  const redFlags = [
    [/(bleed|blood|pus|ooz|discharge)/, "you mentioned bleeding, pus, or discharge"],
    [/(fever|chills|very sick|unwell)/, "you mentioned fever or feeling unwell"],
    [/(severe pain|unbearable|extreme pain|very painful)/, "you mentioned severe pain"],
    [/(rapidly spread|spreading fast|swollen|swelling|blister|open wound|open cut)/, "you mentioned a spreading, swollen, blistered, or open area"],
    [/(pregnan|breastfeed|medication|prescription)/, "you mentioned pregnancy, breastfeeding, or medication, which needs individual professional advice"],
    [/(hives|trouble breathing|face swelling|anaphyl)/, "you mentioned signs of a serious allergic reaction"]
  ];
  const found = redFlags.find(([pattern]) => pattern.test(text));
  return found ? found[1] : "";
}

function outcomeData() {
  const product = state.selectedProduct;
  const sensitivityAnswer = normalize(state.answers.sensitivity || "");
  const reactionAnswer = normalize(state.answers.past_reaction || "");
  const drynessAnswer = normalize(state.answers.dryness || "");
  const sensitive = /(yes often|sometimes|itch|sting|irritat|khujli|jalan)/.test(sensitivityAnswer) || /(yes|little irritation|burning|rash|darkening)/.test(reactionAnswer) || /(tight or itchy|itch|irritat)/.test(drynessAnswer);
  const freshlyShaved = /^yes$/.test(normalize(state.answers.hair_removal || ""));
  const brokenSkin = /no it s broken|broken|open/.test(normalize(state.answers.skin_state || ""));
  const alternative = product.category === "roll_on" ? state.catalog.find(item => item.id === "sensitive_roll_on") : state.catalog.find(item => item.id === "gentle_body_wash");
  if (brokenSkin) return { kind: "red", product: null, title: "Pause product use for now.", copy: "Because the skin may be broken, it’s safest to speak with a pharmacist or clinician before applying an active product.", reasons: ["Active products can sting or irritate compromised skin.", "A professional can assess the area and advise on next steps."] };
  if (product.id === "aha_roll_on" && freshlyShaved) return { kind: "partial", product: alternative, title: "A gentler roll-on is the better fit today.", copy: "The AHA roll-on is not ideal immediately after shaving or waxing. Sensitive Care is the lower-friction option for your current routine.", reasons: ["It avoids exfoliating acids on freshly hair-removed skin.", "It is unscented and designed for sensitive underarms.", "You can revisit the AHA option once the skin is fully settled."] };
  if (sensitive && product.fragrance === "Scented") return { kind: "partial", product: alternative, title: "A gentler, unscented option fits better.", copy: `Because you mentioned sensitivity, ${alternative.shortName} is likely a more comfortable starting point than the scented option.`, reasons: ["It is unscented, reducing one common trigger.", "It stays in the same care category.", "Start slowly and stop if irritation develops."] };
  return { kind: "good", product, title: `${product.shortName} looks like a good fit.`, copy: `Based on your answers, this product aligns with the concern and routine you described. Use it exactly as the label directs and monitor how your skin feels.`, reasons: [`It addresses ${product.purpose.slice(0, 2).join(" and ")}.`, `${product.keyActive} matches the product’s intended care purpose.`, "You did not indicate a current conflict with its label cautions."] };
}

function renderOutcome() {
  const result = outcomeData();
  if (result.kind === "red") { state.redFlag = "your skin may be broken or irritated"; state.screen = "report"; return renderReport(); }
  const label = result.kind === "good" ? "Good fit" : "Better match found";
  return `<section class="screen card"><span class="verdict ${result.kind}">${result.kind === "good" ? "●" : "✦"} ${label}</span><h1 class="outcome-title">${escapeHtml(result.title)}</h1><p class="outcome-copy">${escapeHtml(result.copy)}</p><ul class="reason-list">${result.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join("")}</ul><div class="product-panel">${productVisual(result.product)}<div><h2 class="product-name">${escapeHtml(result.product.name)}</h2><p class="product-meta">${escapeHtml(result.product.keyActive)} · ${escapeHtml(result.product.fragrance)}</p><span class="mini-tag">${result.kind === "good" ? "Recommended for you" : "Recommended alternative"}</span></div></div><div class="usage"><strong>How to use</strong>${escapeHtml(result.product.usage)}</div><div class="outcome-actions"><button class="primary-button" data-action="restart" type="button">Start a new check</button><button class="secondary-button" data-action="show-cautions" type="button">View label cautions</button></div><p class="disclaimer">This is product guidance, not a diagnosis. Stop use and seek professional advice if you develop a reaction.</p></section>`;
}

function renderReport() {
  const reason = state.redFlag || "your answers need individual professional advice";
  return `<section class="screen card printable"><span class="verdict red">! Get professional advice</span><h1 class="outcome-title">Let’s pause the product recommendation.</h1><p class="outcome-copy">We’re recommending a pharmacist or clinician because ${escapeHtml(reason)}. This guide cannot assess or treat this safely.</p><div class="red-flag-panel"><strong>Get urgent help now</strong>If you have trouble breathing, facial swelling, rapidly spreading redness, severe pain, or feel very unwell, seek urgent medical care.</div><div class="report-form"><label for="report-duration">How long has this been happening? <small>(optional)</small></label><input id="report-duration" placeholder="e.g. 3 days" /><label for="report-tried">What have you tried already? <small>(optional)</small></label><textarea id="report-tried" rows="2" placeholder="e.g. stopped using deodorant, tried moisturiser"></textarea><label for="report-extra">Anything else to share with a clinician? <small>(optional)</small></label><textarea id="report-extra" rows="2" placeholder="e.g. medications, pregnancy, known allergies"></textarea></div><div class="report-preview"><h3>Clinician discussion summary</h3><p><strong>Main concern:</strong> <span id="summary-concern">${escapeHtml(state.concern || "Product suitability check")}</span></p><p><strong>Reason for escalation:</strong> ${escapeHtml(reason)}</p><p><strong>Product considered:</strong> ${escapeHtml(state.selectedProduct?.name || "Not selected")}</p><p><strong>Your responses:</strong> <span id="summary-extra">Add optional details above if useful.</span></p><p class="disclaimer">Generated on this device from the user’s answers. This is not a diagnosis or treatment plan.</p></div><div class="outcome-actions"><button class="primary-button" data-action="print-report" type="button">Print / save as PDF</button><button class="secondary-button" data-action="restart" type="button">Start over</button></div><p class="disclaimer">No information is uploaded or saved by this app. Use your browser’s print dialog to save or share the report.</p></section>`;
}

function attachScreenEvents() {
  document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", handleAction));
  document.querySelectorAll("[data-product]").forEach(button => button.addEventListener("click", () => { state.selectedProduct = state.catalog.find(product => product.id === button.dataset.product); beginConversation(); }));
  document.querySelectorAll("[data-concern]").forEach(button => button.addEventListener("click", () => chooseConcern(button.dataset.concern)));
  const search = document.querySelector("#product-search");
  if (search) search.addEventListener("input", () => filterProducts(search.value));
  if (search) search.addEventListener("keydown", event => { if (event.key === "Enter") { const product = filteredProducts(search.value)[0]; if (product) { state.selectedProduct = product; beginConversation(); } } });
  const custom = document.querySelector("#custom-concern");
  const customContinue = document.querySelector("#custom-concern-next");
  if (customContinue) customContinue.addEventListener("click", () => chooseConcern(custom.value || "General body care"));
  if (custom) custom.addEventListener("keydown", event => { if (event.key === "Enter") chooseConcern(custom.value || "General body care"); });
  const answerInput = document.querySelector("#answer-input");
  document.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => answerQuestion(button.dataset.answer)));
  if (answerInput) answerInput.addEventListener("keydown", event => { if (event.key === "Enter") answerQuestion(answerInput.value); });
  document.querySelectorAll(".report-form input, .report-form textarea").forEach(field => field.addEventListener("input", updateReportPreview));
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "product-path") { state.screen = "product"; render(); }
  if (action === "concern-path") { state.screen = "concern"; render(); }
  if (action === "back-home" || action === "restart") reset();
  if (action === "send-answer") answerQuestion(document.querySelector("#answer-input").value);
  if (action === "unknown") answerQuestion("Not sure");
  if (action === "voice") toggleVoice();
  if (action === "show-cautions") { const cautions = state.selectedProduct.cautions.join(" • "); showToast(`Label cautions: ${cautions}`); }
  if (action === "print-report") { updateReportPreview(); window.print(); }
}

function filteredProducts(query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return state.catalog;
  return state.catalog.filter(product => normalize(`${product.name} ${product.keyActive} ${product.purpose.join(" ")} ${product.category}`).includes(normalizedQuery) || normalizedQuery.split(" ").some(word => normalize(`${product.name} ${product.keyActive} ${product.purpose.join(" ")}`).includes(word)));
}

function filterProducts(query) {
  const results = document.querySelector("#product-results");
  const products = filteredProducts(query);
  results.innerHTML = products.length ? products.map(productResult).join("") : `<div class="result"><span><b>No supported product found</b><small>Try a concern instead and we’ll guide you.</small></span></div>`;
  results.querySelectorAll("[data-product]").forEach(button => button.addEventListener("click", () => { state.selectedProduct = state.catalog.find(product => product.id === button.dataset.product); beginConversation(); }));
}

function voiceSupported() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }

function toggleVoice() {
  if (!voiceSupported()) { showToast("Voice input is not available in this browser. You can type your answer instead."); return; }
  if (recognition && state.isListening) { recognition.stop(); return; }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new Recognition();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onstart = () => { state.isListening = true; const button = document.querySelector("[data-action='voice']"); const note = document.querySelector("#voice-note"); if (button) button.classList.add("listening"); if (note) note.textContent = "Listening… speak your answer, then pause."; };
  recognition.onresult = event => { const transcript = Array.from(event.results).map(result => result[0].transcript).join(""); const input = document.querySelector("#answer-input"); if (input) input.value = transcript; };
  recognition.onerror = () => showToast("Voice input could not start. Please type your answer.");
  recognition.onend = () => { state.isListening = false; const button = document.querySelector("[data-action='voice']"); const note = document.querySelector("#voice-note"); if (button) button.classList.remove("listening"); if (note) note.textContent = "Voice input is optional and stays in your browser."; };
  recognition.start();
}

function updateReportPreview() {
  const duration = document.querySelector("#report-duration")?.value.trim();
  const tried = document.querySelector("#report-tried")?.value.trim();
  const extra = document.querySelector("#report-extra")?.value.trim();
  const summary = [duration && `Duration: ${duration}.`, tried && `Tried: ${tried}.`, extra && `Notes: ${extra}.`].filter(Boolean).join(" ");
  const target = document.querySelector("#summary-extra");
  if (target) target.textContent = summary || "Add optional details above if useful.";
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 4200);
}

document.querySelector("#restart-button").addEventListener("click", reset);
document.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); reset(); });
document.querySelector("#dismiss-privacy").addEventListener("click", () => document.querySelector(".privacy-banner").remove());
loadCatalog();
