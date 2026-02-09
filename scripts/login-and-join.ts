import { Client } from "colyseus.js";

const API_URL = process.env.API_URL || "http://localhost:3000";
const WS_URL = process.env.WS_URL || "ws://localhost:2567";

const USERNAME = process.env.TEST_USERNAME || "test1";
const EMAIL = process.env.TEST_EMAIL || "test1@example.com";
const PASSWORD = process.env.TEST_PASSWORD || "123456";

async function registerOrLogin(): Promise<string> {
  const registerRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, email: EMAIL, password: PASSWORD })
  });

  if (registerRes.ok) {
    const data = await registerRes.json();
    return data.token as string;
  }

  // If register fails (e.g., user exists), try login
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  if (!loginRes.ok) {
    const text = await loginRes.text();
    throw new Error(`Login failed: ${loginRes.status} ${text}`);
  }

  const loginData = await loginRes.json();
  return loginData.token as string;
}

async function main() {
  console.log(`API: ${API_URL}`);
  console.log(`WS:  ${WS_URL}`);

  const token = await registerOrLogin();
  console.log("JWT acquired");

  const client = new Client(WS_URL);
  // Some colyseus.js versions expect auth token on client.auth
  (client as any).auth = { token };

  try {
    const room = await client.joinOrCreate("my_room", {
      token,
      auth: { token },
      name: USERNAME
    });

    console.log(`Joined room: ${room.id}`);
    room.onMessage("joined", (payload) => {
      console.log("Server joined payload:", payload);
    });
  } catch (err: any) {
    console.error("Join failed:", err?.message || err);
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
