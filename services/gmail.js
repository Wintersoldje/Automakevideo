const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const loadCredentials = () => {
  if (process.env.GMAIL_CREDENTIALS_JSON) {
    return JSON.parse(process.env.GMAIL_CREDENTIALS_JSON);
  }
  const filePath = path.join(__dirname, "..", "secrets", "gmail_credentials.json");
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  throw new Error("Gmail credentials not found. Set GMAIL_CREDENTIALS_JSON or secrets/gmail_credentials.json");
};

const loadToken = () => {
  if (process.env.GMAIL_TOKEN_JSON) {
    return JSON.parse(process.env.GMAIL_TOKEN_JSON);
  }
  const filePath = path.join(__dirname, "..", "secrets", "gmail_token.json");
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  throw new Error("Gmail token not found. Run npm run auth:gmail to generate token.");
};

const getGmailClient = () => {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const token = loadToken();
  oAuth2Client.setCredentials(token);
  return google.gmail({ version: "v1", auth: oAuth2Client });
};

const decodeBody = (data) => {
  if (!data) return "";
  const buffer = Buffer.from(data, "base64");
  return buffer.toString("utf8");
};

const stripHtml = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const findTextBody = (payload) => {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return stripHtml(decodeBody(payload.body.data));
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = findTextBody(part);
      if (text) return text;
    }
  }
  return "";
};

const isSameKstDate = (messageDate, dateStamp) => {
  const kst = new Date(messageDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const yyyy = String(kst.getFullYear());
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}` === dateStamp;
};

const getTodayNewneekMail = async (dateStamp) => {
  const gmail = getGmailClient();
  const query = "from:whatsup@newneek.co newer_than:2d";
  const list = await gmail.users.messages.list({ userId: "me", q: query });
  const messages = list.data.messages || [];
  for (const message of messages) {
    const detail = await gmail.users.messages.get({ userId: "me", id: message.id, format: "full" });
    const headers = detail.data.payload?.headers || [];
    const dateHeader = headers.find((header) => header.name.toLowerCase() === "date");
    const messageDate = dateHeader ? new Date(dateHeader.value) : new Date(Number(detail.data.internalDate));
    if (!isSameKstDate(messageDate, dateStamp)) {
      continue;
    }
    const bodyText = findTextBody(detail.data.payload);
    if (!bodyText.includes("뉴닉 데일리")) {
      continue;
    }
    return bodyText;
  }
  throw new Error("오늘의 NEWNEEK 데일리 메일을 찾지 못했습니다.");
};

module.exports = {
  SCOPES,
  loadCredentials,
  getGmailClient,
  getTodayNewneekMail,
};
