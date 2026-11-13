const STORAGE_KEY = "cosmic-dust-lab";
const MIN_UPDATE_RATE_MS = 33;
const MAX_UPDATE_RATE_MS = 1000;
const AUTOSAVE_INTERVAL_MS = 10000;
const SAVE_CIPHER_KEY = "cosmic-dust-save-v1";

const initialState = {
  dust: 0,
  collectorLevel: 0,
  multiplierLevel: 0,
  temperatureLevel: 0,
  totalDustGenerated: 0,
  totalClicks: 0,
  lastTickAt: Date.now(),
  entropy: 0,
  singleUpgrades: {},
  quarks: 0,
  unassignedQuarks: 0,
  assignedQuarks: { up: 0, down: 0, strange: 0, charm: 0, top: 0, bottom: 0 },
  strangeBoost: 1,
  activeChallenge: null,
  completedChallenges: { proton: false, electron: false, neutron: false },
  atomCounts: { proton: 0, neutron: 0, electron: 0 },
  automation: { collector: true, multiplier: true, temperature: true, singles: true },
  updateRateMs: MIN_UPDATE_RATE_MS,
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
  atomizeButton: document.querySelector("#atomize-button"),
  quarkifyButton: document.querySelector("#quarkify-button"),
  quarkifyRequirement: document.querySelector("#quarkify-requirement"),
  quarkifyActionLabel: document.querySelector("#quarkify-action-label"),
  quarkGain: document.querySelector("#quark-gain"),
  quarkGainPlural: document.querySelector("#quark-gain-plural"),
  quarksTab: document.querySelector("#quarks-tab"),
  subatomicSwitch: document.querySelector("#subatomic-switch"),
  automationTab: document.querySelector("#automation-tab"),
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
  challengeBanner: document.querySelector("#challenge-banner"),
  challengeBannerText: document.querySelector("#challenge-banner-text"),
  leaveChallengeButton: document.querySelector("#leave-challenge-button"),
  clumpBoost: document.querySelector("#clump-boost"),
  frictionBoost: document.querySelector("#friction-boost"),
  magnetBoost: document.querySelector("#magnet-boost"),
  swirlBoost: document.querySelector("#swirl-boost"),
  chainBoost: document.querySelector("#chain-boost"),
  updateRate: document.querySelector("#update-rate"),
  hardResetButton: document.querySelector("#hard-reset-button"),
  exportButton: document.querySelector("#export-button"),
  importData: document.querySelector("#import-data"),
  importButton: document.querySelector("#import-button"),
  settingsStatus: document.querySelector("#settings-status"),
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
      completedChallenges: { ...initialState.completedChallenges, ...saved.completedChallenges },
      atomCounts: { ...initialState.atomCounts, ...saved.atomCounts },
    };
    loaded.updateRateMs = Math.min(MAX_UPDATE_RATE_MS, Math.max(MIN_UPDATE_RATE_MS, Number(saved.updateRateMs) || MIN_UPDATE_RATE_MS));
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

function encodeSave(save) {
  const json = JSON.stringify(save);
  let encoded = "";
  for (let index = 0; index < json.length; index += 1) {
    encoded += String.fromCharCode(json.charCodeAt(index) ^ SAVE_CIPHER_KEY.charCodeAt(index % SAVE_CIPHER_KEY.length));
  }
  return btoa(encoded);
}

function decodeSave(encodedSave) {
  const encoded = atob(encodedSave.trim());
  let json = "";
  for (let index = 0; index < encoded.length; index += 1) {
    json += String.fromCharCode(encoded.charCodeAt(index) ^ SAVE_CIPHER_KEY.charCodeAt(index % SAVE_CIPHER_KEY.length));
  }
  return JSON.parse(json);
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
  const singlesAllowed = state.activeChallenge !== "neutron";
  const singleCount = singlesAllowed ? Object.values(state.singleUpgrades).filter(Boolean).length : 0;
  const stability = getStability(state.assignedQuarks);
  const topBoost = 1 + Math.sqrt(state.assignedQuarks.top) * 0.15;
  const strangeBoost = Math.pow(state.strangeBoost, Math.sqrt(state.assignedQuarks.strange));
  const singleEffectBoost = 1 + Math.sqrt(state.assignedQuarks.bottom) * 0.035;
  const completeQuarkSets = Math.floor(state.quarks / 3);
  const trioBoost = singlesAllowed && state.singleUpgrades.trioEffect ? 1 + completeQuarkSets * 0.07 : 1;
  const highestQuarkStack = Math.max(...Object.values(state.assignedQuarks));
  const focusBoost = singlesAllowed && state.singleUpgrades.focus ? 1 + Math.sqrt(highestQuarkStack) * 0.07 : 1;
  const challengeGainMultiplier = state.activeChallenge === "electron" ? 0.1 : 1;
  const effectiveLevel = (level) => level <= 64 ? level : 64 + 1.8 * Math.sqrt(level - 64);
  const magnetBoost = singlesAllowed && state.singleUpgrades.magnet ? state.entropy * 0.005 * singleEffectBoost : 0;
  const swirlBoost = singlesAllowed && state.singleUpgrades.swirl ? (state.collectorLevel + state.multiplierLevel + state.temperatureLevel) * 0.01 * singleEffectBoost : 0;
  const frictionBoost = singlesAllowed && state.singleUpgrades.friction ? Math.log10(state.totalClicks + 1) * 0.005 * singleEffectBoost : 0;
  const chainBoost = 1 + (Math.pow(1.5, singleCount) - 1) * singleEffectBoost;
  const baseY = 1 + effectiveLevel(state.collectorLevel);
  const baseMultiplier = 1 + effectiveLevel(state.multiplierLevel);
  const baseTemperature = 1 + effectiveLevel(state.temperatureLevel) * 0.08;
  const y = baseY * (1 + magnetBoost);
  const multiplier = baseMultiplier * (1 + swirlBoost);
  const temperature = baseTemperature + frictionBoost;
  const baseGain = Math.pow(baseY * baseMultiplier, baseTemperature);
  const basePassiveRate = state.collectorLevel * baseGain;
  const clickBoost = singlesAllowed && state.singleUpgrades.clump ? 1 + state.collectorLevel * 0.01 * singleEffectBoost : 1;
  const gain = baseGain * clickBoost * chainBoost * topBoost * strangeBoost * trioBoost * focusBoost * challengeGainMultiplier;
  const challengeClickBoost = state.activeChallenge === "proton" ? 2 : 1;
  const clickValue = gain * challengeClickBoost;
  const passiveRate = state.activeChallenge === "proton" ? 0 : state.collectorLevel * gain;
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
    challengeClickBoost,
    challengeGainMultiplier,
  };
}

function upgradeCost(type) {
  const levels = state[`${type}Level`];
  const bases = { collector: 20, multiplier: 100, temperature: 500 };
  const growth = { collector: 1.6, multiplier: 1.8, temperature: 2.1 };
  const costLevel = levels <= 64 ? levels : 64 + (levels - 64) * 0.5;
  const charmReduction = Math.min(0.1, Math.sqrt(state.assignedQuarks.charm) * 0.012);
  const challengeCostMultiplier = state.activeChallenge === "electron" ? 0.25 : 1;
  return Math.floor(bases[type] * Math.pow(growth[type], costLevel * (1 - charmReduction)) * challengeCostMultiplier);
}

function getQuarkifyRequirement(totalQuarks) {
  return totalQuarks < 20 ? 1e33 : 1e33 * Math.pow(2, totalQuarks - 19);
}

function getQuarkGain() {
  const requirement = getQuarkifyRequirement(state.quarks);
  if (state.quarks < 20) return 1;
  const excessOrders = Math.max(0, Math.floor(Math.log10(state.dust / requirement)));
  return Math.min(5, 2 + Math.floor(excessOrders / 2));
}

function render() {
  const stats = getStats();
  elements.updateRate.value = state.updateRateMs;
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
  const protonChallenge = document.querySelector("[data-challenge=\"proton\"]");
  challengeCards.proton.classList.toggle("active", state.activeChallenge === "proton");
  document.querySelector("#proton-challenge-status").textContent = state.completedChallenges.proton
    ? "Completed · Protons unlocked"
    : state.activeChallenge === "proton" ? "Active · 2× click · 0/s" : "Unlocked";
  const electronUnlocked = state.completedChallenges.proton;
  const neutronUnlocked = state.completedChallenges.electron;
  const electronChallenge = document.querySelector("[data-challenge=\"electron\"]");
  const neutronChallenge = document.querySelector("[data-challenge=\"neutron\"]");
  electronChallenge.classList.toggle("locked", !electronUnlocked);
  electronChallenge.classList.toggle("unlocked", electronUnlocked);
  neutronChallenge.classList.toggle("locked", !neutronUnlocked);
  neutronChallenge.classList.toggle("unlocked", neutronUnlocked);
  electronChallenge.classList.toggle("active", state.activeChallenge === "electron");
  neutronChallenge.classList.toggle("active", state.activeChallenge === "neutron");
  document.querySelector("#electron-challenge-status").textContent = state.completedChallenges.electron
    ? "Completed · Electrons unlocked"
    : state.activeChallenge === "electron" ? "Active · 0.1× gain · 0.25× costs"
      : electronUnlocked ? "Unlocked" : "Locked · Complete Proton challenge";
  document.querySelector("#neutron-challenge-status").textContent = state.completedChallenges.neutron
    ? "Completed · Neutrons unlocked"
    : state.activeChallenge === "neutron" ? "Active · Single upgrades disabled"
      : neutronUnlocked ? "Unlocked" : "Locked · Complete Electron challenge";
  elements.clumpBoost.textContent = `+${state.singleUpgrades.clump ? state.collectorLevel : 0}% click`;
  elements.frictionBoost.textContent = `+${stats.frictionBoost.toFixed(2)} T`;
  elements.magnetBoost.textContent = `+${(stats.magnetBoost * 100).toFixed(1)}% Y`;
  elements.swirlBoost.textContent = `+${(stats.swirlBoost * 100).toFixed(1)}% M`;
  elements.chainBoost.textContent = `×${stats.chainBoost.toFixed(2)} gain`;
  elements.collectorButton.disabled = state.dust < upgradeCost("collector");
  elements.multiplierButton.disabled = state.dust < upgradeCost("multiplier");
  elements.temperatureButton.disabled = state.dust < upgradeCost("temperature");
  const challengeGoal = state.activeChallenge ? 1e33 : null;
  const quarkifyRequirement = challengeGoal ?? getQuarkifyRequirement(state.quarks);
  const quarkGain = challengeGoal ? 0 : getQuarkGain();
  const canQuarkify = state.dust >= quarkifyRequirement;
  elements.quarkifyPanel.classList.toggle("hidden", state.quarks < 1);
  elements.quarkifyButton.disabled = !canQuarkify;
  elements.quarkifyButton.setAttribute("aria-disabled", String(!canQuarkify));
  elements.quarkifyRequirement.textContent = formatDust(quarkifyRequirement);
  elements.quarkGain.textContent = quarkGain;
  elements.quarkGainPlural.textContent = quarkGain === 1 ? "" : "s";
  elements.quarkifyActionLabel.textContent = challengeGoal
    ? `Complete ${state.activeChallenge} challenge`
    : "Quarkify";
  updateAtomizeButton();
  elements.challengeBanner.classList.toggle("hidden", !state.activeChallenge);
  elements.challengeBannerText.textContent = state.activeChallenge === "proton"
    ? "Proton challenge active · reset at 1e33 dust"
    : state.activeChallenge === "electron"
      ? "Electron challenge active · reset at 1e33 dust"
      : "Neutron challenge active · reset at 1e33 dust";
  elements.quarksTab.classList.toggle("hidden", state.quarks < 1);
  elements.automationTab.classList.toggle("hidden", state.quarks < 1);
  elements.subatomicSwitch.classList.toggle("hidden", state.quarks < 30);
  elements.repeatableAutomationStatus.textContent = state.quarks >= 1 ? "Unlocked" : "Locked";
  elements.freeUpgradesStatus.textContent = state.quarks >= 2 ? "Unlocked" : "Locked";
  elements.singleAutomationStatus.textContent = state.quarks >= 6 ? "Unlocked" : "Locked";
  elements.startingDustStatus.textContent = state.quarks >= 20 ? "Unlocked" : "Locked";
  elements.particleCreationStatus.textContent = state.quarks >= 30 ? "Unlocked" : "Locked";
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
    const purchased = state.activeChallenge !== "neutron" && Boolean(state.singleUpgrades[name]);
    const unlocked = state.entropy >= data.entropy && state.quarks >= (data.quarks ?? 0);
    button.closest(".upgrade-card").classList.toggle("owned", purchased);
    button.closest(".upgrade-card").classList.toggle("locked", !purchased && !unlocked);
    status.textContent = state.activeChallenge === "neutron"
      ? "Unavailable in Neutron"
      : purchased ? "Owned" : unlocked ? "Buy" : `${data.entropy} entropy`;
    unlock.textContent = purchased ? "" : unlocked ? "Unlocked" : data.quarks
      ? `${data.quarks} quarks · ${data.entropy} entropy`
      : `${data.entropy} entropy`;
    const purchaseCost = data.cost * (state.activeChallenge === "electron" ? 0.25 : 1);
    cost.textContent = purchased ? "" : formatDust(purchaseCost);
    button.disabled = state.activeChallenge === "neutron" || purchased || !unlocked || state.dust < purchaseCost;
  });
}

function addDust(amount) {
  state.dust += amount;
  state.totalDustGenerated += amount;
  state.entropy = getEntropy(state.totalDustGenerated, state.assignedQuarks);
}

function applyElapsedProgress() {
  const now = Date.now();
  const elapsedSeconds = Math.min(Math.max(0, (now - state.lastTickAt) / 1000), 86400);
  state.lastTickAt = now;
  const passiveRate = getStats().passiveRate;
  if (passiveRate > 0 && elapsedSeconds > 0) addDust(passiveRate * elapsedSeconds);
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
  if (state.activeChallenge === "neutron") return false;
  const cost = data.cost * (state.activeChallenge === "electron" ? 0.25 : 1);
  if (state.singleUpgrades[name] || state.entropy < data.entropy || state.dust < cost) return false;
  if (state.quarks < 2) state.dust -= cost;
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
  if (state.activeChallenge) {
    if (state.dust < 1e33) return;
    const completedChallenge = state.activeChallenge;
    const completedChallenges = { ...state.completedChallenges, [completedChallenge]: true };
    const startingDust = getStartingDust(state.quarks);
    state = {
      ...initialState,
      dust: startingDust,
      totalDustGenerated: startingDust,
      lastTickAt: Date.now(),
      quarks: state.quarks,
      unassignedQuarks: state.unassignedQuarks,
      assignedQuarks: { ...state.assignedQuarks },
      singleUpgrades: {},
      automation: { ...state.automation },
      completedChallenges,
      atomCounts: { ...state.atomCounts },
    };
    saveState();
    render();
    return;
  }
  const quarkGain = getQuarkGain();
  if (state.dust < getQuarkifyRequirement(state.quarks)) return;
  const firstQuarkify = state.quarks === 0;
  const totalQuarks = state.quarks + quarkGain;
  const startingDust = getStartingDust(totalQuarks);
  state = {
    ...initialState,
    dust: startingDust,
    totalDustGenerated: startingDust,
    lastTickAt: Date.now(),
    entropy: getEntropy(startingDust, state.assignedQuarks),
    singleUpgrades: {},
    quarks: totalQuarks,
    unassignedQuarks: state.unassignedQuarks + quarkGain,
    assignedQuarks: { ...state.assignedQuarks },
    automation: { ...state.automation },
    completedChallenges: { ...state.completedChallenges },
    atomCounts: { ...state.atomCounts },
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
  { button: document.querySelector("#main-tab"), view: document.querySelector("#main-view"), title: "" },
  { button: document.querySelector("#quarks-tab"), view: document.querySelector("#quarks-view"), title: "" },
  { button: document.querySelector("#subatomic-tab"), view: document.querySelector("#particles-view"), title: "Subatomic" },
  { button: document.querySelector("#automation-tab"), view: document.querySelector("#automation-view"), title: "Automation" },
  { button: document.querySelector("#statistics-tab"), view: document.querySelector("#statistics-view"), title: "Statistics" },
  { button: document.querySelector("#settings-tab"), view: document.querySelector("#settings-view"), title: "Settings" },
];
const pageTitle = document.querySelector("#page-title");
function setView(selectedView, transitionClass = "") {
  views.forEach(({ button, view, title }) => {
    const active = view === selectedView;
    button.classList.toggle("active", active);
    view.classList.toggle("hidden", !active);
    if (active) {
      pageTitle.textContent = title;
      if (transitionClass) {
        view.classList.remove("slide-in-left", "slide-in-right");
        void view.offsetWidth;
        view.classList.add(transitionClass);
      }
    }
    if (!active) view.classList.remove("slide-in-left", "slide-in-right");
  });
}
views.forEach(({ button, view, title }) => {
  button.addEventListener("click", () => {
    setView(view);
  });
});
document.querySelector("#quarkify-button").addEventListener("click", quarkify);
document.querySelector("#subatomic-tab").addEventListener("click", () => {
  setView(document.querySelector("#particles-view"), "slide-in-right");
});
document.querySelector("#quarks-overview-tab").addEventListener("click", () => {
  setView(document.querySelector("#quarks-view"), "slide-in-left");
});
const challengeCards = {
  proton: document.querySelector("[data-challenge=\"proton\"]"),
  electron: document.querySelector("[data-challenge=\"electron\"]"),
  neutron: document.querySelector("[data-challenge=\"neutron\"]"),
};
function startChallenge(type) {
  const unlocked = type === "proton"
    || (type === "electron" && state.completedChallenges.proton)
    || (type === "neutron" && state.completedChallenges.electron);
  if (state.quarks < 30 || !unlocked || state.completedChallenges[type]) return;
  state = {
    ...initialState,
    dust: getStartingDust(state.quarks),
    totalDustGenerated: getStartingDust(state.quarks),
    lastTickAt: Date.now(),
    quarks: state.quarks,
    unassignedQuarks: state.unassignedQuarks,
    assignedQuarks: { ...state.assignedQuarks },
    automation: { ...state.automation },
    completedChallenges: { ...state.completedChallenges },
    atomCounts: { ...state.atomCounts },
    activeChallenge: type,
  };
  saveState();
  setView(document.querySelector("#main-view"));
  render();
}
Object.entries(challengeCards).forEach(([type, card]) => {
  card.addEventListener("click", () => startChallenge(type));
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    startChallenge(type);
  });
});
elements.leaveChallengeButton.addEventListener("click", () => {
  if (!state.activeChallenge) return;
  state.activeChallenge = null;
  saveState();
  render();
});
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
  const bohrModel = document.querySelector("#bohr-model");
  const particleInputs = {
    proton: document.querySelector("#proton-count"),
    neutron: document.querySelector("#neutron-count"),
    electron: document.querySelector("#electron-count"),
  };
  function updateAtomizeButton() {
    const hydrogenSelected = Number(particleInputs.proton.value) === 1
      && Number(particleInputs.neutron.value) === 0
      && Number(particleInputs.electron.value) === 1;
    elements.atomizeButton.classList.toggle("hidden", !hydrogenSelected);
  }
  Object.entries(state.atomCounts).forEach(([type, count]) => {
    particleInputs[type].value = count;
  });
  const elementNames = ["", "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon"];
  function renderBohrModel() {
    const counts = Object.fromEntries(Object.entries(particleInputs).map(([type, input]) => [type, Number(input.value) || 0]));
    const protonCount = counts.proton;
    const neutronCount = counts.neutron;
    const electronCount = counts.electron;
    const nucleonCount = protonCount + neutronCount;
    const elementName = elementNames[protonCount] || (protonCount ? `Element ${protonCount}` : "Empty model");
    const charge = protonCount - electronCount;
    const chargeLabel = charge ? ` (${charge > 0 ? "+" : ""}${charge})` : "";
    const upCost = protonCount * 2 + neutronCount;
    const downCost = protonCount + neutronCount * 2;
    const entropyCost = protonCount === 1 && neutronCount === 0 && electronCount === 1
      ? 11
      : nucleonCount ? 25 + nucleonCount * 10 : 0;
    document.querySelector("#element-name").textContent = `${elementName}${chargeLabel}`;
    document.querySelector("#element-cost").textContent = `Cost: ${upCost} up · ${downCost} down · ${entropyCost} entropy`;
    bohrModel.querySelectorAll(".bohr-particle").forEach((particle) => particle.remove());
    bohrModel.querySelector("#bohr-nucleus").textContent = nucleonCount ? `${protonCount}p · ${neutronCount}n` : "Drop particles here";
    const addDot = (type, index, total, radius) => {
      const dot = document.createElement("span");
      dot.className = `bohr-particle ${type}-dot`;
      dot.textContent = type[0].toUpperCase();
      const angle = total ? (index / total) * Math.PI * 2 : 0;
      dot.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
      dot.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
      bohrModel.appendChild(dot);
    };
    for (let index = 0; index < protonCount; index += 1) addDot("proton", index, Math.max(protonCount, neutronCount), 24);
    for (let index = 0; index < neutronCount; index += 1) addDot("neutron", index, Math.max(protonCount, neutronCount), 34);
    for (let index = 0; index < electronCount; index += 1) {
      const inner = index < 2;
      const shellIndex = inner ? index : index - 2;
      const shellTotal = inner ? Math.min(electronCount, 2) : electronCount - 2;
      addDot("electron", shellIndex, shellTotal, inner ? 65 : 125);
    }
  }
  Object.values(particleInputs).forEach((input) => input.addEventListener("input", () => {
    state.atomCounts = Object.fromEntries(Object.entries(particleInputs).map(([type, field]) => [type, Number(field.value) || 0]));
    saveState();
    renderBohrModel();
    updateAtomizeButton();
    render();
  }));
  renderBohrModel();

function setSettingsStatus(message) {
  elements.settingsStatus.textContent = message;
}

elements.updateRate.addEventListener("change", (event) => {
  const requestedRate = Number(event.target.value);
  state.updateRateMs = Math.min(MAX_UPDATE_RATE_MS, Math.max(MIN_UPDATE_RATE_MS, Number.isFinite(requestedRate) ? requestedRate : MIN_UPDATE_RATE_MS));
  event.target.value = state.updateRateMs;
  saveState();
  restartGameLoop();
  setSettingsStatus(`Update rate set to ${state.updateRateMs} ms.`);
});

elements.hardResetButton.addEventListener("click", () => {
  if (!window.confirm("Hard reset all game progress?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  state.lastTickAt = Date.now();
  saveState();
  render();
  setSettingsStatus("Game hard reset.");
});

elements.exportButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(encodeSave(state));
    setSettingsStatus("Save copied to clipboard.");
  } catch {
    setSettingsStatus("Could not access the clipboard.");
  }
});

elements.importButton.addEventListener("click", () => {
  try {
    const imported = decodeSave(elements.importData.value);
    if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error("Invalid save");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
    state = loadState();
    state.lastTickAt = Date.now();
    saveState();
    render();
    setSettingsStatus("Save imported.");
  } catch {
    setSettingsStatus("Invalid save data.");
  }
});

const automationPurchaseMs = 33;
let saveTimerMs = 0;
let automationTimerMs = 0;
let gameLoopId;

function runGameLoop() {
  applyElapsedProgress();
  automationTimerMs += state.updateRateMs;
  let automated = false;
  if (automationTimerMs >= automationPurchaseMs) {
    automationTimerMs = 0;
    automated = runAutomation();
  }
  const passiveRate = getStats().passiveRate;
  saveTimerMs += state.updateRateMs;
  if (saveTimerMs >= AUTOSAVE_INTERVAL_MS) {
    saveState();
    saveTimerMs = 0;
  }
  if (automated || passiveRate) render();
}

function restartGameLoop() {
  clearInterval(gameLoopId);
  gameLoopId = setInterval(runGameLoop, state.updateRateMs);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  applyElapsedProgress();
  saveState();
  render();
});

setInterval(() => {
  if (!state.assignedQuarks.strange) return;
  state.strangeBoost = 0.2 + Math.random() * 4.8;
  saveState();
  render();
}, 30000);

applyElapsedProgress();
render();
restartGameLoop();
