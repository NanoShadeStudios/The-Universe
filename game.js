const STORAGE_KEY = "cosmic-dust-lab";

const initialState = {
  dust: 0,
  collectorLevel: 0,
  multiplierLevel: 0,
  temperatureLevel: 0,
  totalDustGenerated: 0,
  totalClicks: 0,
  entropy: 0,
  singleUpgrades: {},
  quarks: 0,
  unassignedQuarks: 0,
  assignedQuarks: { up: 0, down: 0, strange: 0, charm: 0, top: 0, bottom: 0 },
  strangeBoost: 1,
  automation: { collector: true, multiplier: true, temperature: true, singles: true },
};

let state = loadState();

const elements = {
  dust: document.querySelector("#dust-count"),
  collectorLevel: document.querySelector("#collector-level"),
  collectorCost: document.querySelector("#collector-cost"),
  multiplierLevel: document.querySelector("#multiplier-level"),
  multiplierCost: document.querySelector("#multiplier-cost"),
  temperatureLevel: document.querySelector("#temperature-level"),
  temperatureCost: document.querySelector("#temperature-cost"),
  collectorButton: document.querySelector("#collector-button"),
  multiplierButton: document.querySelector("#multiplier-button"),
  temperatureButton: document.querySelector("#temperature-button"),
  trioEffectBoost: document.querySelector("#trio-effect-boost"),
  focusBoost: document.querySelector("#focus-boost"),
  collectorBoost: document.querySelector("#collector-boost"),
  multiplierBoost: document.querySelector("#multiplier-boost"),
  temperatureBoost: document.querySelector("#temperature-boost"),
  statDust: document.querySelector("#stat-dust"),
  statClick: document.querySelector("#stat-click"),
  statRate: document.querySelector("#stat-rate"),
  statEntropy: document.querySelector("#stat-entropy"),
  statYou: document.querySelector("#stat-you"),
  statMultiplier: document.querySelector("#stat-multiplier"),
  statTemperature: document.querySelector("#stat-temperature"),
  entropy: document.querySelector("#entropy-count"),
  entropyCap: document.querySelector("#entropy-cap"),
  formula: document.querySelector("#formula-display"),
  quarkifyPanel: document.querySelector("#quarkify-panel"),
  quarkifyButton: document.querySelector("#quarkify-button"),
  quarkifyRequirement: document.querySelector("#quarkify-requirement"),
  quarkGain: document.querySelector("#quark-gain"),
  quarkGainPlural: document.querySelector("#quark-gain-plural"),
  quarksTab: document.querySelector("#quarks-tab"),
  automationTab: document.querySelector("#automation-tab"),
  particlesTab: document.querySelector("#particles-tab"),
  repeatableAutomationStatus: document.querySelector("#repeatable-automation-status"),
  singleAutomationStatus: document.querySelector("#single-automation-status"),
  freeUpgradesStatus: document.querySelector("#free-upgrades-status"),
  particleCreationStatus: document.querySelector("#particle-creation-status"),
  startingDustStatus: document.querySelector("#starting-dust-status"),
  unassignedQuarks: document.querySelector("#unassigned-quarks"),
  totalQuarks: document.querySelector("#total-quarks"),
  stability: document.querySelector("#stability-count"),
  stabilityBoost: document.querySelector("#stability-boost"),
  topEffect: document.querySelector("#top-effect"),
  strangeEffect: document.querySelector("#strange-effect"),
  clumpBoost: document.querySelector("#clump-boost"),
  frictionBoost: document.querySelector("#friction-boost"),
  magnetBoost: document.querySelector("#magnet-boost"),
  swirlBoost: document.querySelector("#swirl-boost"),
  chainBoost: document.querySelector("#chain-boost"),
};

const quarkTypes = ["up", "down", "strange", "charm", "top", "bottom"];

const singleUpgradeData = {
  clump: { entropy: 1, cost: 1e3 },
  friction: { entropy: 3, cost: 1e6 },
  magnet: { entropy: 5, cost: 1e12 },
  swirl: { entropy: 9, cost: 1e20 },
  chain: { entropy: 10, cost: 1e27 },
  trioEffect: { entropy: 10, quarks: 15, cost: 1e12 },
  focus: { entropy: 11, quarks: 15, cost: 1e15 },
};

const numberUnits = [
  [1e33, "Dc"],
  [1e30, "No"],
  [1e27, "Oc"],
  [1e24, "Sp"],
  [1e21, "Sx"],
  [1e18, "Qi"],
  [1e15, "Qa"],
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "k"],
];

const formatDust = (value) => {
  if (value < 1000) return Math.floor(value).toLocaleString();
  if (value > 1e33) return value.toExponential(2).replace("e+", "e");
  const unit = numberUnits.find(([threshold]) => value >= threshold);
  return `${(value / unit[0]).toFixed(2)}${unit[1]}`;
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return { ...initialState };
    const loaded = {
      ...initialState,
      ...saved,
      singleUpgrades: { ...initialState.singleUpgrades, ...saved.singleUpgrades },
      assignedQuarks: { ...initialState.assignedQuarks, ...saved.assignedQuarks },
      automation: { ...initialState.automation, ...saved.automation },
    };
    loaded.totalDustGenerated = saved.totalDustGenerated ?? saved.dust ?? 0;
    loaded.entropy = getEntropy(loaded.totalDustGenerated, loaded.assignedQuarks);
    return loaded;
  } catch {
    return { ...initialState };
  }

}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getStability(assignedQuarks) {
  const total = Object.values(assignedQuarks).reduce((sum, count) => sum + count, 0);
  const distinctTypes = Object.values(assignedQuarks).filter((count) => count > 0).length;
  return Math.sqrt(total) * (1 + Math.max(0, distinctTypes - 1) * 0.15);
}

function getEntropy(totalDust, assignedQuarks = initialState.assignedQuarks) {
  const stability = getStability(assignedQuarks);
  const entropyCap = getEntropyCap(assignedQuarks);
  const entropyGain = 1 + stability * 0.02;
  return Math.min(entropyCap, Math.floor(Math.log10(totalDust + 1) * 0.5 * entropyGain * 10) / 10);
}

function getEntropyCap(assignedQuarks) {
  return 10 + Math.log2(getStability(assignedQuarks) + 1) * 0.5;
}

function getStats() {
  const singleCount = Object.values(state.singleUpgrades).filter(Boolean).length;
  const stability = getStability(state.assignedQuarks);
  const topBoost = 1 + Math.sqrt(state.assignedQuarks.top) * 0.1;
  const strangeBoost = Math.pow(state.strangeBoost, Math.sqrt(state.assignedQuarks.strange));
  const singleEffectBoost = 1 + Math.sqrt(state.assignedQuarks.bottom) * 0.03;
  const completeQuarkSets = Math.floor(state.quarks / 3);
  const trioBoost = state.singleUpgrades.trioEffect ? 1 + completeQuarkSets * 0.05 : 1;
  const highestQuarkStack = Math.max(...Object.values(state.assignedQuarks));
  const focusBoost = state.singleUpgrades.focus ? 1 + Math.sqrt(highestQuarkStack) * 0.05 : 1;
  const effectiveLevel = (level) => level <= 64 ? level : 64 + 1.8 * Math.sqrt(level - 64);
  const magnetBoost = state.singleUpgrades.magnet ? state.entropy * 0.005 * singleEffectBoost : 0;
  const swirlBoost = state.singleUpgrades.swirl ? (state.collectorLevel + state.multiplierLevel + state.temperatureLevel) * 0.01 * singleEffectBoost : 0;
  const frictionBoost = state.singleUpgrades.friction ? Math.log10(state.totalClicks + 1) * 0.005 * singleEffectBoost : 0;
  const chainBoost = 1 + (Math.pow(1.5, singleCount) - 1) * singleEffectBoost;
  const baseY = 1 + effectiveLevel(state.collectorLevel);
  const baseMultiplier = 1 + effectiveLevel(state.multiplierLevel);
  const baseTemperature = 1 + effectiveLevel(state.temperatureLevel) * 0.08;
  const y = baseY * (1 + magnetBoost);
  const multiplier = baseMultiplier * (1 + swirlBoost);
  const temperature = baseTemperature + frictionBoost;
  const baseGain = Math.pow(baseY * baseMultiplier, baseTemperature);
  const basePassiveRate = state.collectorLevel * baseGain;
  const clickBoost = state.singleUpgrades.clump ? 1 + state.collectorLevel * 0.01 * singleEffectBoost : 1;
  const gain = baseGain * clickBoost * chainBoost * topBoost * strangeBoost * trioBoost * focusBoost;
  const clickValue = gain;
  const passiveRate = state.collectorLevel * gain;
  return {
    clickValue,
    passiveRate,
    basePassiveRate,
    totalBoost: basePassiveRate ? passiveRate / basePassiveRate : 1,
    magnetBoost,
    swirlBoost,
    frictionBoost,
    chainBoost,
    clickBoost,
    y,
    multiplier,
    temperature,
    baseY,
    baseMultiplier,
    baseTemperature,
    stability,
    topBoost,
    strangeBoost,
    singleEffectBoost,
    trioBoost,
    focusBoost,
  };
}

function upgradeCost(type) {
  const levels = state[`${type}Level`];
  const bases = { collector: 20, multiplier: 100, temperature: 500 };
  const growth = { collector: 1.6, multiplier: 1.8, temperature: 2.1 };
  const costLevel = levels <= 64 ? levels : 64 + (levels - 64) * 0.5;
  const charmReduction = Math.min(0.1, Math.sqrt(state.assignedQuarks.charm) * 0.01);
  return Math.floor(bases[type] * Math.pow(growth[type], costLevel * (1 - charmReduction)));
}

function getQuarkifyRequirement(totalQuarks) {
  return totalQuarks < 20 ? 1e33 : 1e33 * Math.pow(10, totalQuarks - 19);
}

function getQuarkGain() {
  const requirement = getQuarkifyRequirement(state.quarks);
  if (state.quarks < 20) return 1;
  const excessOrders = Math.max(0, Math.floor(Math.log10(state.dust / requirement)));
  return Math.min(5, 2 + Math.floor(excessOrders / 2));
}

function render() {
  const stats = getStats();
  elements.dust.textContent = formatDust(state.dust);
  elements.collectorLevel.textContent = `Lv. ${state.collectorLevel}`;
  elements.multiplierLevel.textContent = `Lv. ${state.multiplierLevel}`;
  elements.temperatureLevel.textContent = `Lv. ${state.temperatureLevel}`;
  elements.collectorBoost.textContent = `+${state.collectorLevel}/s · +${state.collectorLevel}/click`;
  elements.multiplierBoost.textContent = `×${((1 + state.multiplierLevel) * (1 + stats.swirlBoost)).toFixed(2)} M`;
  elements.temperatureBoost.textContent = `+${(state.temperatureLevel * 0.1 + stats.frictionBoost).toFixed(2)} T`;
  elements.collectorCost.textContent = formatDust(upgradeCost("collector"));
  elements.multiplierCost.textContent = formatDust(upgradeCost("multiplier"));
  elements.temperatureCost.textContent = formatDust(upgradeCost("temperature"));
  elements.trioEffectBoost.textContent = `×${stats.trioBoost.toFixed(2)} M`;
  elements.focusBoost.textContent = `×${stats.focusBoost.toFixed(2)} gain`;
  elements.statDust.textContent = formatDust(state.dust);
  elements.statClick.textContent = formatDust(stats.clickValue);
  elements.statRate.textContent = formatDust(stats.passiveRate);
  elements.statEntropy.textContent = state.entropy.toFixed(1);
  elements.statYou.textContent = `Lv. ${state.collectorLevel}`;
  elements.statMultiplier.textContent = `Lv. ${state.multiplierLevel}`;
  elements.statTemperature.textContent = `Lv. ${state.temperatureLevel}`;
  elements.entropy.textContent = state.entropy.toFixed(1);
  elements.entropyCap.textContent = getEntropyCap(state.assignedQuarks).toFixed(2);
  const formulaNumber = (value) => value < 1000 ? value.toFixed(2) : formatDust(value);
  elements.formula.innerHTML = `Base/s = ${state.collectorLevel} × (${formulaNumber(stats.baseY)} × ${formulaNumber(stats.baseMultiplier)})<sup>${formulaNumber(stats.baseTemperature)}</sup> = ${formatDust(stats.basePassiveRate)} · Boosts ×${formulaNumber(stats.totalBoost)} · Total/s = ${formatDust(stats.passiveRate)}`;
  elements.clumpBoost.textContent = `+${state.singleUpgrades.clump ? state.collectorLevel : 0}% click`;
  elements.frictionBoost.textContent = `+${stats.frictionBoost.toFixed(2)} T`;
  elements.magnetBoost.textContent = `+${(stats.magnetBoost * 100).toFixed(1)}% Y`;
  elements.swirlBoost.textContent = `+${(stats.swirlBoost * 100).toFixed(1)}% M`;
  elements.chainBoost.textContent = `×${stats.chainBoost.toFixed(2)} gain`;
  elements.collectorButton.disabled = state.dust < upgradeCost("collector");
  elements.multiplierButton.disabled = state.dust < upgradeCost("multiplier");
  elements.temperatureButton.disabled = state.dust < upgradeCost("temperature");
  const quarkifyRequirement = getQuarkifyRequirement(state.quarks);
  const quarkGain = getQuarkGain();
  elements.quarkifyPanel.classList.toggle("hidden", state.dust < quarkifyRequirement);
  elements.quarkifyButton.disabled = state.dust < quarkifyRequirement;
  elements.quarkifyRequirement.textContent = formatDust(quarkifyRequirement);
  elements.quarkGain.textContent = quarkGain;
  elements.quarkGainPlural.textContent = quarkGain === 1 ? "" : "s";
  elements.quarksTab.classList.toggle("hidden", state.quarks < 1);
  elements.automationTab.classList.toggle("hidden", state.quarks < 1);
  elements.particlesTab.classList.toggle("hidden", state.quarks < 100);
  elements.repeatableAutomationStatus.textContent = state.quarks >= 1 ? "Unlocked" : "Locked";
  elements.freeUpgradesStatus.textContent = state.quarks >= 2 ? "Unlocked" : "Locked";
  elements.singleAutomationStatus.textContent = state.quarks >= 6 ? "Unlocked" : "Locked";
  elements.startingDustStatus.textContent = state.quarks >= 20 ? "Unlocked" : "Locked";
  elements.particleCreationStatus.textContent = state.quarks >= 100 ? "Unlocked" : "Locked";
  document.querySelector("#single-automation-enabled").checked = state.automation.singles;
  document.querySelectorAll("[data-automation]").forEach((input) => {
    input.checked = state.automation[input.dataset.automation];
    input.disabled = state.quarks < 1;
  });
  document.querySelector("#single-automation-enabled").disabled = state.quarks < 6;
  elements.unassignedQuarks.textContent = state.unassignedQuarks;
  elements.totalQuarks.textContent = state.quarks;
  elements.stability.textContent = getStability(state.assignedQuarks).toFixed(2);
  elements.stabilityBoost.textContent = `+${(stats.stability * 2).toFixed(2)}% entropy gain · +${(Math.log2(stats.stability + 1) * 0.5).toFixed(2)} entropy cap`;
  elements.topEffect.textContent = `×${stats.topBoost.toFixed(2)} production.`;
  elements.strangeEffect.textContent = `×${stats.strangeBoost.toFixed(2)} dust production right now.`;
  quarkTypes.forEach((type) => {
    document.querySelector(`#${type}-quarks`).textContent = state.assignedQuarks[type];
  });
  Object.entries(singleUpgradeData).forEach(([name, data]) => {
    const button = document.querySelector(`#${name}-button`);
    const status = document.querySelector(`#${name}-status`);
    const cost = document.querySelector(`#${name}-cost`);
    const unlock = document.querySelector(`#${name}-unlock`);
    const purchased = Boolean(state.singleUpgrades[name]);
    const unlocked = state.entropy >= data.entropy && state.quarks >= (data.quarks ?? 0);
    button.closest(".upgrade-card").classList.toggle("owned", purchased);
    button.closest(".upgrade-card").classList.toggle("locked", !purchased && !unlocked);
    status.textContent = purchased ? "Owned" : unlocked ? "Buy" : `${data.entropy} entropy`;
    unlock.textContent = purchased ? "" : unlocked ? "Unlocked" : data.quarks
      ? `${data.quarks} quarks · ${data.entropy} entropy`
      : `${data.entropy} entropy`;
    cost.textContent = purchased ? "" : formatDust(data.cost);
    button.disabled = purchased || !unlocked || state.dust < data.cost;
  });
}

function addDust(amount) {
  state.dust += amount;
  state.totalDustGenerated += amount;
  state.entropy = getEntropy(state.totalDustGenerated, state.assignedQuarks);
}

function collectDust(event) {
  state.totalClicks += 1;
  const clickValue = getStats().clickValue;
  addDust(clickValue);
  showClickGain(clickValue, event);
  saveState();
  render();
}

function showClickGain(amount, event) {
  const button = document.querySelector("#collect-button");
  const popup = document.createElement("span");
  popup.className = "click-gain";
  popup.textContent = `+${formatDust(amount)}`;
  const bounds = button.getBoundingClientRect();
  popup.style.left = `${event ? event.clientX - bounds.left : bounds.width / 2}px`;
  popup.style.top = `${event ? event.clientY - bounds.top : bounds.height / 2}px`;
  button.appendChild(popup);
  window.setTimeout(() => popup.remove(), 800);
}

function buyUpgrade(type) {
  if (!purchaseUpgrade(type)) return;
  saveState();
  render();
}

function purchaseUpgrade(type) {
  const cost = upgradeCost(type);
  if (state.dust < cost) return false;
  if (state.quarks < 2) state.dust -= cost;
  state[`${type}Level`] += 1;
  return true;
}

function buySingleUpgrade(name) {
  if (!purchaseSingleUpgrade(name)) return;
  saveState();
  render();
}

function purchaseSingleUpgrade(name) {
  const data = singleUpgradeData[name];
  if (state.singleUpgrades[name] || state.entropy < data.entropy || state.dust < data.cost) return false;
  if (state.quarks < 2) state.dust -= data.cost;
  state.singleUpgrades[name] = true;
  return true;
}

function getStartingDust(totalQuarks) {
  return totalQuarks >= 20 ? 1000 : 0;
}

function runAutomation() {
  if (state.quarks < 1) return false;
  let changed = false;
  ["collector", "multiplier", "temperature"].forEach((type) => {
    if (state.automation[type]) changed = purchaseUpgrade(type) || changed;
  });
  if (state.quarks >= 6 && state.automation.singles) {
    Object.keys(singleUpgradeData).forEach((name) => {
      changed = purchaseSingleUpgrade(name) || changed;
    });
  }
  return changed;
}

function quarkify() {
  const quarkGain = getQuarkGain();
  if (state.dust < getQuarkifyRequirement(state.quarks)) return;
  const firstQuarkify = state.quarks === 0;
  const totalQuarks = state.quarks + quarkGain;
  const startingDust = getStartingDust(totalQuarks);
  state = {
    ...initialState,
    dust: startingDust,
    totalDustGenerated: startingDust,
    entropy: getEntropy(startingDust, state.assignedQuarks),
    singleUpgrades: {},
    quarks: totalQuarks,
    unassignedQuarks: state.unassignedQuarks + quarkGain,
    assignedQuarks: { ...state.assignedQuarks },
    automation: { ...state.automation },
  };
  saveState();
  elements.quarksTab.classList.remove("hidden");
  if (firstQuarkify) setView(document.querySelector("#quarks-view"));
  render();
}

function assignQuark(type) {
  if (!state.unassignedQuarks) return;
  state.unassignedQuarks -= 1;
  state.assignedQuarks[type] += 1;
  state.entropy = getEntropy(state.totalDustGenerated, state.assignedQuarks);
  saveState();
  render();
}

document.querySelector("#collect-button").addEventListener("click", (event) => collectDust(event));
document.querySelectorAll("[data-upgrade]").forEach((card) => {
  const type = card.dataset.upgrade;
  card.addEventListener("click", () => buyUpgrade(type));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      buyUpgrade(type);
    }
  });
});
Object.keys(singleUpgradeData).forEach((name) => {
  const card = document.querySelector(`[data-single-upgrade="${name}"]`);
  card.addEventListener("click", () => buySingleUpgrade(name));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      buySingleUpgrade(name);
    }
  });
});
const views = [
  { button: document.querySelector("#main-tab"), view: document.querySelector("#main-view"), title: "Cosmic Dust" },
  { button: document.querySelector("#quarks-tab"), view: document.querySelector("#quarks-view"), title: "Quarks" },
  { button: document.querySelector("#automation-tab"), view: document.querySelector("#automation-view"), title: "Automation" },
  { button: document.querySelector("#particles-tab"), view: document.querySelector("#particles-view"), title: "Particles" },
  { button: document.querySelector("#statistics-tab"), view: document.querySelector("#statistics-view"), title: "Statistics" },
  { button: document.querySelector("#help-tab"), view: document.querySelector("#help-view"), title: "Help" },
];
const pageTitle = document.querySelector("#page-title");
function setView(selectedView) {
  views.forEach(({ button, view, title }) => {
    const active = view === selectedView;
    button.classList.toggle("active", active);
    view.classList.toggle("hidden", !active);
    if (active) pageTitle.textContent = title;
  });
}
views.forEach(({ button, view, title }) => {
  button.addEventListener("click", () => {
    setView(view);
  });
});
document.querySelector("#quarkify-button").addEventListener("click", quarkify);
document.querySelector("#single-automation-enabled").addEventListener("change", (event) => {
  state.automation.singles = event.target.checked;
  saveState();
  render();
});
document.querySelectorAll("[data-automation]").forEach((input) => {
  input.addEventListener("change", (event) => {
    state.automation[event.target.dataset.automation] = event.target.checked;
    saveState();
    render();
  });
});
document.querySelectorAll("[data-quark-type]").forEach((card) => {
  const type = card.dataset.quarkType;
  card.addEventListener("click", () => assignQuark(type));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      assignQuark(type);
    }
  });
});
document.querySelector("#reset-button").addEventListener("click", () => {
  if (!window.confirm("Reset all gathered dust and upgrades?")) return;
  const startingDust = getStartingDust(state.quarks);
  state = {
    ...initialState,
    dust: startingDust,
    totalDustGenerated: startingDust,
    entropy: getEntropy(startingDust, state.assignedQuarks),
    singleUpgrades: {},
    quarks: state.quarks,
    unassignedQuarks: state.unassignedQuarks,
    assignedQuarks: { ...state.assignedQuarks },
    automation: { ...state.automation },
  };
  saveState();
  render();
});

const passiveTickMs = 33;
const automationPurchaseMs = 33;
let saveTimerMs = 0;
let automationTimerMs = 0;
setInterval(() => {
  automationTimerMs += passiveTickMs;
  let automated = false;
  if (automationTimerMs >= automationPurchaseMs) {
    automationTimerMs = 0;
    automated = runAutomation();
  }
  const passiveRate = getStats().passiveRate;
  if (passiveRate) addDust(passiveRate * passiveTickMs / 1000);
  saveTimerMs += passiveTickMs;
  if (saveTimerMs >= 1000) {
    saveState();
    saveTimerMs = 0;
  }
  if (automated || passiveRate) render();
}, passiveTickMs);

setInterval(() => {
  if (!state.assignedQuarks.strange) return;
  state.strangeBoost = 0.2 + Math.random() * 4.8;
  saveState();
  render();
}, 30000);

render();
