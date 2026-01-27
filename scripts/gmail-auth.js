const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");
const { SCOPES, loadCredentials } = require("../services/gmail");

const TOKEN_PATH = path.join(__dirname, "..", "secrets", "gmail_token.json");

const authorize = async () => {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("아래 URL을 브라우저에서 열고 인증 코드를 입력하세요:");
  console.log(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("인증 코드: ", async (code) => {
    rl.close();
    const tokenResponse = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokenResponse.tokens);
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenResponse.tokens, null, 2));
    console.log("토큰이 저장되었습니다:", TOKEN_PATH);
  });
};

authorize().catch((error) => {
  console.error("Gmail 인증 실패:", error.message);
});
