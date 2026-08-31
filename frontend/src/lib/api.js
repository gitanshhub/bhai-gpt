import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 60000 });

export const api = {
  chat: (payload) => client.post("/chat", payload).then((r) => r.data),
  history: (session_id, mode) =>
    client.get(`/chat/history`, { params: { session_id, mode } }).then((r) => r.data),
  clearHistory: (session_id, mode) =>
    client.delete(`/chat/history`, { params: { session_id, mode } }).then((r) => r.data),
  lafda: (payload = {}) => client.post("/lafda", payload).then((r) => r.data),
  cooked: (payload) => client.post("/cooked", payload).then((r) => r.data),
  aura: (payload) => client.post("/aura", payload).then((r) => r.data),
  rateLife: (payload) => client.post("/rate-life", payload).then((r) => r.data),
  broCourt: (payload) => client.post("/bro-court", payload).then((r) => r.data),
};

// Session id lives in localStorage for this browser
export function getSessionId() {
  let sid = localStorage.getItem("bakchod_session");
  if (!sid) {
    sid = `bkchd-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
    localStorage.setItem("bakchod_session", sid);
  }
  return sid;
}
