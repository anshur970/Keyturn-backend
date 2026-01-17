import { uid } from "../utils/uid.js";

const KEY = "keyturn_db_v1";
const SESSION_KEY = "keyturn_session_v1";

function read() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}
function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

function ensure() {
  const existing = read();
  if (existing) return existing;
  return write({
    users: [],
    vehicles: [],
    reservations: [],
    ratePlans: [],
    damageReports: [],
    invoices: [],
    driverVerifications: [],
    customers: [],
    agents: [],
  });
}

function getDB() {
  return ensure();
}

function setDB(next) {
  return write(next);
}

export const db = {
  raw: {
    get: getDB,
    set: setDB,
  },

  session: {
    get: () => {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    },
    set: (session) => localStorage.setItem(SESSION_KEY, JSON.stringify(session)),
    clear: () => localStorage.removeItem(SESSION_KEY),
  },

  users: {
    list: () => getDB().users,
    findByEmail: (email) => getDB().users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    create: ({ name, email, password, role }) => {
      const data = getDB();
      const created = { id: uid("usr"), name, email, password, role };
      data.users.push(created);
      setDB(data);
      return created;
    },
    updateRole: (id, role) => {
      const data = getDB();
      const u = data.users.find((x) => x.id === id);
      if (!u) return null;
      u.role = role;
      setDB(data);
      return u;
    },
  },

  vehicles: {
    list: () => getDB().vehicles,
    create: (v) => {
      const data = getDB();
      const created = { id: uid("veh"), ...v };
      data.vehicles.push(created);
      setDB(data);
      return created;
    },
    update: (id, patch) => {
      const data = getDB();
      const v = data.vehicles.find((x) => x.id === id);
      if (!v) return null;
      Object.assign(v, patch);
      setDB(data);
      return v;
    },
    remove: (id) => {
      const data = getDB();
      data.vehicles = data.vehicles.filter((x) => x.id !== id);
      setDB(data);
    },
  },

  ratePlans: {
    list: () => getDB().ratePlans,
    create: (p) => {
      const data = getDB();
      const created = { id: uid("rate"), ...p };
      data.ratePlans.push(created);
      setDB(data);
      return created;
    },
    update: (id, patch) => {
      const data = getDB();
      const p = data.ratePlans.find((x) => x.id === id);
      if (!p) return null;
      Object.assign(p, patch);
      setDB(data);
      return p;
    },
    remove: (id) => {
      const data = getDB();
      data.ratePlans = data.ratePlans.filter((x) => x.id !== id);
      setDB(data);
    },
  },

  reservations: {
    list: () => getDB().reservations,
    create: (r) => {
      const data = getDB();
      const created = { id: uid("res"), status: "hold", createdAt: Date.now(), ...r };
      data.reservations.push(created);
      setDB(data);
      return created;
    },
    update: (id, patch) => {
      const data = getDB();
      const r = data.reservations.find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      setDB(data);
      return r;
    },
  },

  driverVerifications: {
    list: () => getDB().driverVerifications,
    create: (d) => {
      const data = getDB();
      const created = { id: uid("drv"), status: "pending", createdAt: Date.now(), ...d };
      data.driverVerifications.push(created);
      setDB(data);
      return created;
    },
    update: (id, patch) => {
      const data = getDB();
      const d = data.driverVerifications.find((x) => x.id === id);
      if (!d) return null;
      Object.assign(d, patch);
      setDB(data);
      return d;
    },
  },

  damageReports: {
    list: () => getDB().damageReports,
    create: (dr) => {
      const data = getDB();
      const created = { id: uid("dmg"), status: "open", createdAt: Date.now(), ...dr };
      data.damageReports.push(created);
      setDB(data);
      return created;
    },
    update: (id, patch) => {
      const data = getDB();
      const dr = data.damageReports.find((x) => x.id === id);
      if (!dr) return null;
      Object.assign(dr, patch);
      setDB(data);
      return dr;
    },
  },

  invoices: {
    list: () => getDB().invoices,
    create: (inv) => {
      const data = getDB();
      const created = { id: uid("inv"), status: "unpaid", createdAt: Date.now(), ...inv };
      data.invoices.push(created);
      setDB(data);
      return created;
    },
    update: (id, patch) => {
      const data = getDB();
      const inv = data.invoices.find((x) => x.id === id);
      if (!inv) return null;
      Object.assign(inv, patch);
      setDB(data);
      return inv;
    },
  },

  customers: {
    list: () => getDB().customers,
    create: (c) => {
      const data = getDB();
      const created = { id: uid("cus"), ...c };
      data.customers.push(created);
      setDB(data);
      return created;
    },
  },

  agents: {
    list: () => getDB().agents,
    create: (a) => {
      const data = getDB();
      const created = { id: uid("agt"), ...a };
      data.agents.push(created);
      setDB(data);
      return created;
    },
  },
};
