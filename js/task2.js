const MAX_ENERGY = 10;
const START_ENERGY = 6;
const GATHER_ENERGY = 1;
const GATHER_AMOUNT = 2;
const CRAFT_ENERGY = 2;
const REST_ENERGY = 4;
const MAX_PER_ITEM = 12;

const ITEMS = [
  { id: 1, name: "Wood", kind: "material", count: 4, value: 1, rare: false },
  { id: 2, name: "Stone", kind: "material", count: 3, value: 1, rare: false },
  { id: 3, name: "Rope", kind: "material", count: 2, value: 2, rare: false },
  { id: 4, name: "Cloth", kind: "material", count: 2, value: 2, rare: false },
  { id: 5, name: "Iron", kind: "material", count: 1, value: 3, rare: true },
  { id: 6, name: "Herbs", kind: "material", count: 2, value: 2, rare: false },
  { id: 7, name: "Water", kind: "material", count: 3, value: 1, rare: false },
  { id: 8, name: "Clay", kind: "material", count: 2, value: 1, rare: false },
  { id: 9, name: "Tent", kind: "product", count: 0, value: 8, rare: false },
  { id: 10, name: "Campfire", kind: "product", count: 1, value: 4, rare: false },
  { id: 11, name: "Axe", kind: "product", count: 0, value: 6, rare: false },
  { id: 12, name: "Medkit", kind: "product", count: 0, value: 5, rare: false },
  { id: 13, name: "Lantern", kind: "product", count: 0, value: 6, rare: true },
  { id: 14, name: "Water filter", kind: "product", count: 0, value: 7, rare: true },
];

const RECIPES = [
  { id: 1, product: 9, needs: [{ item: 1, qty: 3 }, { item: 4, qty: 2 }, { item: 3, qty: 1 }] },
  { id: 2, product: 10, needs: [{ item: 1, qty: 2 }, { item: 2, qty: 3 }] },
  { id: 3, product: 11, needs: [{ item: 1, qty: 1 }, { item: 5, qty: 2 }, { item: 3, qty: 1 }] },
  { id: 4, product: 12, needs: [{ item: 6, qty: 2 }, { item: 4, qty: 1 }, { item: 7, qty: 1 }] },
  { id: 5, product: 13, needs: [{ item: 5, qty: 1 }, { item: 8, qty: 2 }, { item: 1, qty: 1 }] },
  { id: 6, product: 14, needs: [{ item: 8, qty: 2 }, { item: 2, qty: 1 }, { item: 7, qty: 2 }, { item: 4, qty: 1 }] },
];

const workshopEl = document.getElementById("workshop");
const searchEl = document.getElementById("search");
const categoryEl = document.getElementById("category");
const messageEl = document.getElementById("message");

const state = {
  energy: START_ENERGY,
  search: "",
  category: "all",
  notice: { text: "Gather materials, then craft something for the camp.", type: "" },
  focus: null,
};

function findItem(id) {
  return ITEMS.find(function (item) { return item.id === id; });
}

function findRecipe(productId) {
  return RECIPES.find(function (recipe) { return recipe.product === productId; });
}

function describeNeeds(needs) {
  const parts = [];
  for (const need of needs) {
    parts.push(findItem(need.item).name + " ×" + need.qty);
  }
  return parts.join(", ");
}

function missingFor(recipe) {
  const missing = [];
  for (const need of recipe.needs) {
    const have = findItem(need.item).count;
    if (have < need.qty) {
      missing.push({ item: need.item, qty: need.qty - have });
    }
  }
  return missing;
}

function campValue() {
  let total = 0;
  for (const item of ITEMS) {
    total += item.count * item.value;
  }
  return total;
}

function notify(text, type) {
  state.notice = { text: text, type: type };
}

function gather(item) {
  const reasons = [];
  if (state.energy < GATHER_ENERGY) {
    reasons.push("not enough energy (need " + GATHER_ENERGY + ")");
  }
  if (item.count + GATHER_AMOUNT > MAX_PER_ITEM) {
    reasons.push("the camp can hold at most " + MAX_PER_ITEM + " of this item");
  }
  if (reasons.length > 0) {
    notify("Cannot gather " + item.name + ": " + reasons.join("; ") + ".", "error");
    return;
  }
  state.energy -= GATHER_ENERGY;
  item.count += GATHER_AMOUNT;
  notify("Gathered " + GATHER_AMOUNT + " × " + item.name + ".", "success");
}

function craft(item) {
  const recipe = findRecipe(item.id);
  const reasons = [];
  if (!recipe) {
    notify(item.name + " cannot be crafted.", "error");
    return;
  }
  const missing = missingFor(recipe);
  if (missing.length > 0) {
    reasons.push("missing " + describeNeeds(missing));
  }
  if (state.energy < CRAFT_ENERGY) {
    reasons.push("not enough energy (need " + CRAFT_ENERGY + ")");
  }
  if (item.count >= MAX_PER_ITEM) {
    reasons.push("the camp already has " + MAX_PER_ITEM + " × " + item.name);
  }
  if (reasons.length > 0) {
    notify("Cannot craft " + item.name + ": " + reasons.join("; ") + ".", "error");
    return;
  }
  for (const need of recipe.needs) {
    findItem(need.item).count -= need.qty;
  }
  state.energy -= CRAFT_ENERGY;
  item.count += 1;
  notify("Crafted: " + item.name + ".", "success");
}

function rest() {
  if (state.energy === MAX_ENERGY) {
    notify("You are already full of energy.", "error");
    return;
  }
  state.energy = Math.min(MAX_ENERGY, state.energy + REST_ENERGY);
  notify("You rested. Energy: " + state.energy + " / " + MAX_ENERGY + ".", "success");
}

function visibleItems() {
  const text = state.search.trim().toLowerCase();
  return ITEMS.filter(function (item) {
    const nameOk = text === "" || item.name.toLowerCase().includes(text);
    const kindOk = state.category === "all" || item.kind === state.category;
    return nameOk && kindOk;
  });
}

function createChip(text, extraClass) {
  const chip = document.createElement("li");
  chip.className = "kb-chip" + (extraClass ? " " + extraClass : "");
  chip.textContent = text;
  return chip;
}

function createButton(action, id, text, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "kb-card__btn";
  button.dataset.action = action;
  button.dataset.id = String(id);
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "kb-card";
  card.classList.toggle("is-full", item.count >= MAX_PER_ITEM);

  const title = document.createElement("h3");
  title.className = "kb-card__title";
  title.textContent = item.name;

  const meta = document.createElement("ul");
  meta.className = "kb-card__meta";
  meta.append(createChip(item.kind === "material" ? "Material" : "Product"));
  meta.append(createChip("In camp: " + item.count));
  meta.append(createChip("Value: " + item.value));
  if (item.rare) {
    meta.append(createChip("Rare", "kb-chip--urgent"));
  }
  card.append(title, meta);

  const recipe = findRecipe(item.id);
  if (recipe) {
    const needs = document.createElement("p");
    needs.className = "ws-recipe";
    needs.textContent = "Needs: " + describeNeeds(recipe.needs);
    card.append(needs);
  }

  const actions = document.createElement("div");
  actions.className = "kb-card__actions";
  if (item.kind === "material") {
    actions.append(createButton("gather", item.id, "Gather +" + GATHER_AMOUNT, "Gather " + item.name));
  } else {
    actions.append(createButton("craft", item.id, "Craft", "Craft " + item.name));
  }
  card.append(actions);
  return card;
}

function createStatus() {
  const bar = document.createElement("div");
  bar.className = "ws-status";

  const energy = document.createElement("p");
  energy.className = "ws-status__text";
  energy.textContent = "Energy: " + state.energy + " / " + MAX_ENERGY;

  const energyBar = document.createElement("progress");
  energyBar.max = MAX_ENERGY;
  energyBar.value = state.energy;
  energyBar.setAttribute("aria-label", "Energy");

  const value = document.createElement("p");
  value.className = "ws-status__text";
  value.textContent = "Camp value: " + campValue();

  const restBtn = document.createElement("button");
  restBtn.type = "button";
  restBtn.className = "btn";
  restBtn.dataset.action = "rest";
  restBtn.textContent = "Rest (+" + REST_ENERGY + ")";

  bar.append(energy, energyBar, value, restBtn);
  return bar;
}

function render() {
  workshopEl.replaceChildren();
  workshopEl.append(createStatus());

  const items = visibleItems();
  if (items.length === 0) {
    const nothing = document.createElement("p");
    nothing.className = "kb-nothing";
    nothing.textContent = "Nothing found. Change the search or the category.";
    workshopEl.append(nothing);
  } else {
    const grid = document.createElement("div");
    grid.className = "kb-board";
    for (const item of items) {
      grid.append(createCard(item));
    }
    workshopEl.append(grid);
  }

  messageEl.textContent = state.notice.text;
  messageEl.classList.toggle("msg--error", state.notice.type === "error");
  messageEl.classList.toggle("msg--success", state.notice.type === "success");

  if (state.focus) {
    let selector = 'button[data-action="' + state.focus.action + '"]';
    if (state.focus.id) {
      selector += '[data-id="' + state.focus.id + '"]';
    }
    const again = workshopEl.querySelector(selector);
    if (again) again.focus();
    state.focus = null;
  }
}

workshopEl.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const item = findItem(Number(button.dataset.id));
  if (action === "gather" && item) {
    gather(item);
  } else if (action === "craft" && item) {
    craft(item);
  } else if (action === "rest") {
    rest();
  } else {
    return;
  }
  state.focus = { action: action, id: button.dataset.id || "" };
  render();
});

searchEl.addEventListener("input", function () {
  state.search = searchEl.value;
  render();
});

categoryEl.addEventListener("change", function () {
  state.category = categoryEl.value;
  render();
});

render();
