const axios = require('axios');
const path = require('path');

const GITHUB_TOKEN = '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'; // Ganti kalau perlu
const REPO_OWNER = 'sampahdoank';
const REPO_NAME = 'fufuk';
const MEDIA_FOLDER = 'upload';

async function uploadToGithub(buffer, filename, mimetype) {
  try {
    const content = buffer.toString('base64');
    const filePath = `${MEDIA_FOLDER}/${Date.now()}_${filename}`;
    const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

    // Check if file exists
    const check = await axios.get(githubApiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }).catch(() => null); // ignore 404

    const payload = {
      message: `upload ${filename}`,
      content,
      committer: {
        name: "Uploader Bot",
        email: "uploader@fukucloud.my.id"
      }
    };

    // If file exists, add SHA for update
    if (check?.data?.sha) {
      payload.sha = check.data.sha;
    }

    const res = await axios.put(githubApiUrl, payload, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    return {
      status: true,
      url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${filePath}`,
      path: filePath,
      filename: path.basename(filePath),
      mimetype
    };

  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    return {
      status: false,
      error: error.response?.data || error.message
    };
  }
}

module.exports = {
  uploadToGithub
};
