const STUDENT_DOMAIN = "@astanait.edu.kz";
const NAME_MIN = 3;
const NAME_MAX = 24;
const ID_LENGTH = 4;
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const TRACKS = [
  { id: "web", name: "Web apps", seatsLeft: 3 },
  { id: "ai", name: "AI and data", seatsLeft: 2 },
  { id: "games", name: "Games", seatsLeft: 1 },
  { id: "security", name: "Cybersecurity", seatsLeft: 0 },
];
const takenNames = ["Byte Bandits", "Null Pointers", "Code Ninjas"];
const registeredEmails = [
  "aigerim.s@astanait.edu.kz",
  "daniyar.k@astanait.edu.kz",
  "timur.a@astanait.edu.kz",
  "friend@gmail.com",
];

const FIELD_IDS = ["teamName", "track", "size", "captainName", "captainEmail", "member2", "member3", "member4"];
const MEMBER_IDS = ["member2", "member3", "member4"];
const EMAIL_IDS = ["captainEmail", "member2", "member3", "member4"];

const form = document.getElementById("team-form");
const summaryEl = document.getElementById("error-summary");
const previewEl = document.getElementById("preview");
const seatsEl = document.getElementById("preview-seats");
const resultEl = document.getElementById("result");
const fields = {};
for (const id of FIELD_IDS) {
  fields[id] = document.getElementById(id);
}
const touched = new Set();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findTrack(id) {
  return TRACKS.find(function (track) { return track.id === id; });
}

function fillTracks() {
  const chosen = fields.track.value;
  fields.track.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "Choose a track…";
  fields.track.append(first);
  for (const track of TRACKS) {
    const option = document.createElement("option");
    option.value = track.id;
    option.textContent = track.name + (track.seatsLeft > 0 ? " (" + track.seatsLeft + " places left)" : " (full)");
    fields.track.append(option);
  }
  fields.track.value = chosen;
}

function memberCount() {
  const size = Number(fields.size.value);
  return Number.isInteger(size) && size >= 2 ? size - 1 : 0;
}

function isActive(id) {
  const index = MEMBER_IDS.indexOf(id);
  return index === -1 || index < memberCount();
}

function activeIds() {
  return FIELD_IDS.filter(isActive);
}

function showError(id, message) {
  const errorEl = document.getElementById("error-" + id);
  errorEl.textContent = message;
  errorEl.hidden = message === "";
  fields[id].setAttribute("aria-invalid", message === "" ? "false" : "true");
}

function hideError(id) {
  const errorEl = document.getElementById("error-" + id);
  errorEl.textContent = "";
  errorEl.hidden = true;
  fields[id].removeAttribute("aria-invalid");
}

function applyMembers() {
  for (const id of MEMBER_IDS) {
    const wrap = document.getElementById("wrap-" + id);
    const active = isActive(id);
    wrap.hidden = !active;
    if (!active) {
      fields[id].value = "";
      touched.delete(id);
      hideError(id);
    }
  }
}

function emailValue(id) {
  return fields[id].value.trim().toLowerCase();
}

function getMessage(id) {
  const field = fields[id];
  const value = field.value.trim();
  if (value === "") return "This field is required.";

  if (id === "teamName") {
    if (value.length < NAME_MIN || value.length > NAME_MAX) {
      return "Use " + NAME_MIN + " to " + NAME_MAX + " characters.";
    }
    for (const name of takenNames) {
      if (name.toLowerCase() === value.toLowerCase()) {
        return "The name “" + name + "” is already taken. Choose another one.";
      }
    }
  }

  if (id === "track") {
    const track = findTrack(value);
    if (track && track.seatsLeft <= 0) {
      return "No places left in the track “" + track.name + "”. Choose another track.";
    }
  }

  if (id === "captainName") {
    const words = value.split(/\s+/);
    const lettersOnly = words.every(function (word) { return /^[\p{L}'-]{2,}$/u.test(word); });
    if (words.length !== 2 || !lettersOnly) {
      return "Enter first and last name: exactly two words, letters only.";
    }
  }

  if (EMAIL_IDS.includes(id)) {
    if (field.validity.typeMismatch) return "Enter a valid email address.";
    const email = value.toLowerCase();
    if (id === "captainEmail" && !email.endsWith(STUDENT_DOMAIN)) {
      return "The captain needs a university email ending with " + STUDENT_DOMAIN + ".";
    }
    if (registeredEmails.includes(email)) {
      return "This email is already registered in another team.";
    }
    let same = 0;
    for (const other of EMAIL_IDS) {
      if (isActive(other) && emailValue(other) === email) {
        same += 1;
      }
    }
    if (same > 1) return "This email is used twice in your team. Each member needs their own.";
  }
  return "";
}

function validateField(id) {
  const message = getMessage(id);
  showError(id, message);
  return message;
}

function updatePreview() {
  const track = findTrack(fields.track.value);
  const members = [];
  for (const id of MEMBER_IDS) {
    if (isActive(id) && fields[id].value.trim() !== "") {
      members.push(fields[id].value.trim());
    }
  }
  const rows = [
    ["Team", fields.teamName.value.trim()],
    ["Track", track ? track.name : ""],
    ["Size", fields.size.value],
    ["Captain", fields.captainName.value.trim()],
    ["Captain email", fields.captainEmail.value.trim()],
    ["Members", members.join(", ")],
  ];
  previewEl.replaceChildren();
  for (const row of rows) {
    const dt = document.createElement("dt");
    dt.textContent = row[0];
    const dd = document.createElement("dd");
    dd.textContent = row[1] === "" ? "—" : row[1];
    dd.classList.toggle("is-empty", row[1] === "");
    previewEl.append(dt, dd);
  }
  seatsEl.textContent = track ? "Places left in this track: " + track.seatsLeft : "Choose a track to see free places.";
}

function revalidateTouchedEmails(exceptId) {
  for (const id of EMAIL_IDS) {
    if (id !== exceptId && isActive(id) && touched.has(id)) {
      validateField(id);
    }
  }
}

function handleInput(event) {
  const id = event.target.id;
  if (!FIELD_IDS.includes(id)) return;
  if (id === "size") {
    applyMembers();
  }
  updatePreview();
  if (touched.has(id)) {
    validateField(id);
  }
  revalidateTouchedEmails(id);
}

function makeTeamId() {
  let code = "";
  for (let i = 0; i < ID_LENGTH; i += 1) {
    code += ID_ALPHABET[randomInt(0, ID_ALPHABET.length - 1)];
  }
  return "TEAM-" + code;
}

function createLine(label, text) {
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = label + ": ";
  p.append(strong, text);
  return p;
}

function register() {
  const track = findTrack(fields.track.value);
  const teamName = fields.teamName.value.trim();
  const emails = [];
  for (const id of EMAIL_IDS) {
    if (isActive(id)) emails.push(fields[id].value.trim());
  }
  const captain = fields.captainName.value.trim();
  const size = fields.size.value;

  takenNames.push(teamName);
  for (const email of emails) {
    registeredEmails.push(email.toLowerCase());
  }
  track.seatsLeft -= 1;

  const card = document.createElement("article");
  card.className = "tk-ticket";
  const title = document.createElement("h2");
  title.className = "tk-preview__title";
  title.textContent = "Team registered";
  const code = document.createElement("p");
  code.className = "tk-ticket__code";
  code.textContent = makeTeamId();
  card.append(
    title,
    createLine("Team", teamName),
    createLine("Track", track.name),
    createLine("Captain", captain),
    createLine("Members", size),
    createLine("Emails", emails.join(", ")),
    code
  );
  resultEl.replaceChildren(card);

  form.reset();
  touched.clear();
  for (const id of FIELD_IDS) hideError(id);
  summaryEl.hidden = true;
  fillTracks();
  applyMembers();
  updatePreview();
}

form.noValidate = true;
form.addEventListener("input", handleInput);
form.addEventListener("change", handleInput);

form.addEventListener("focusout", function (event) {
  const id = event.target.id;
  if (!FIELD_IDS.includes(id)) return;
  touched.add(id);
  validateField(id);
});

form.querySelector('button[type="submit"]').addEventListener("mousedown", function (event) {
  event.preventDefault();
});

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const invalid = [];
  for (const id of activeIds()) {
    touched.add(id);
    if (validateField(id) !== "") invalid.push(id);
  }
  if (invalid.length > 0) {
    summaryEl.hidden = false;
    summaryEl.textContent = "Please fix " + invalid.length + (invalid.length === 1 ? " error" : " errors") + " before registering.";
    fields[invalid[0]].focus();
    return;
  }
  summaryEl.hidden = true;
  register();
});

fillTracks();
applyMembers();
updatePreview();
