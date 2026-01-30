import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH;

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Fetch existing file from GitHub
    const fileRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json'
      }
    });
    const fileData = await fileRes.json();

    const sha = fileData.sha; // needed for update
    const users = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));

    // Add new user
    users.push({ username, email, password });

    // Update file in GitHub
    const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `Add user ${username}`,
        content: Buffer.from(JSON.stringify(users, null, 2)).toString('base64'),
        sha
      })
    });

    if (updateRes.ok) res.json({ success: true });
    else res.json({ success: false });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
