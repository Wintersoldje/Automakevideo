import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import { getTodayDateKST } from "./utils.js";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const DEFAULT_CREDENTIALS_PATH = path.join(
  process.cwd(),
  "secrets",
  "gmail_credentials.json"
);
const DEFAULT_TOKEN_PATH = path.join(process.cwd(), "secrets", "gmail_token.json");

const loadCredentials = async () => {
  if (process.env.GMAIL_CREDENTIALS_JSON) {
    return JSON.parse(process.env.GMAIL_CREDENTIALS_JSON);
  }
  const content = await fs.readFile(DEFAULT_CREDENTIALS_PATH, "utf-8");
  return JSON.parse(content);
};

const loadToken = async () => {
  if (process.env.GMAIL_TOKEN_JSON) {
    return JSON.parse(process.env.GMAIL_TOKEN_JSON);
  }
  const content = await fs.readFile(DEFAULT_TOKEN_PATH, "utf-8");
  return JSON.parse(content);
};

const saveToken = async (token) => {
  await fs.mkdir(path.dirname(DEFAULT_TOKEN_PATH), { recursive: true });
  await fs.writeFile(DEFAULT_TOKEN_PATH, JSON.stringify(token, null, 2));
};

export const getGmailAuth = async () => {
  const credentials = await loadCredentials();
  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  try {
    const token = await loadToken();
    oAuth2Client.setCredentials(token);
  } catch (error) {
    throw new Error(
      "Gmail 토큰이 없습니다. 먼저 OAuth 토큰을 생성해 secrets/gmail_token.json에 저장해 주세요."
    );
  }
  oAuth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      saveToken({ ...oAuth2Client.credentials, ...tokens });
    }
  });
  return oAuth2Client;
};

const decodeBody = (data) =>
  Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf-8"
  );

const extractTextFromPayload = (payload) => {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = decodeBody(payload.body.data);
    const withBreaks = html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n");
    return withBreaks
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{2,}/g, "\n");
  }
  if (payload.parts?.length) {
    return payload.parts.map(extractTextFromPayload).join("\n");
  }
  return "";
};

const isKstDate = (internalDate, targetDate) => {
  const date = new Date(Number(internalDate));
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date).replace(/-/g, "") === targetDate;
};

export const fetchTodayNewneekMail = async () => {
  const auth = await getGmailAuth();
  const gmail = google.gmail({ version: "v1", auth });
  const today = getTodayDateKST();
  const list = await gmail.users.messages.list({
    userId: "me",
    q: 'from:whatsup@newneek.co "뉴닉 데일리"',
    maxResults: 5,
  });
  const messages = list.data.messages || [];
  if (!messages.length) {
    throw new Error("오늘자 뉴닉 데일리 메일을 찾지 못했습니다.");
  }

  const detailedMessages = [];
  for (const message of messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });
    detailedMessages.push(detail.data);
  }

  const todaysMessages = detailedMessages
    .filter((msg) => msg.internalDate && isKstDate(msg.internalDate, today))
    .sort((a, b) => Number(b.internalDate) - Number(a.internalDate));

  if (!todaysMessages.length) {
    throw new Error("오늘(KST) 기준 뉴닉 데일리 메일이 없습니다.");
  }

  const target = todaysMessages[0];
  const body = extractTextFromPayload(target.payload);
  if (!body.includes("뉴닉 데일리")) {
    throw new Error("뉴닉 데일리 문구가 있는 메일을 찾지 못했습니다.");
  }
  return body;
};
