import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Octokit } from '@octokit/rest';
import ignore from 'ignore';
import * as fs from 'fs';
import * as glob from 'glob';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to get all files respecting .gitignore
async function getFilesToPublish() {
  const rootDir = process.cwd();
  
  // Create an ignore instance
  const ig = ignore().add(['node_modules', 'dist', '.git', '.aistudio']);
  
  try {
    const gitignorePath = path.join(rootDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      ig.add(gitignoreContent);
    }
  } catch (err) {
    console.warn("Could not read .gitignore", err);
  }

  const allFiles = await glob.glob('**/*', { 
    cwd: rootDir, 
    nodir: true,
    dot: true,
    ignore: ['node_modules/**', 'dist/**', '.git/**'] 
  });

  // Filter with ignore
  const filteredFiles = allFiles.filter(file => !ig.ignores(file));
  return filteredFiles;
}

app.post('/api/publish', async (req, res) => {
  const { pat, name, description, isPrivate } = req.body;

  if (!pat || !name) {
    return res.status(400).json({ error: 'PAT and Repository Name are required.' });
  }

  try {
    const octokit = new Octokit({ auth: pat });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    // 1. Create Repository
    console.log(`Creating repository ${name}...`);
    let repo;
    try {
      const response = await octokit.rest.repos.createForAuthenticatedUser({
        name,
        description: description || 'Published from Google AI Studio',
        private: isPrivate,
        auto_init: true, // we need it initialized to get a base tree
      });
      repo = response.data;
    } catch (e: any) {
      if (e.status === 422) {
        return res.status(400).json({ error: 'Repository already exists or name is invalid.' });
      }
      throw e;
    }

    const owner = user.login;

    // 2. Read files
    console.log('Reading files from workspace...');
    const rootDir = process.cwd();
    const files = await getFilesToPublish();

    // 3. Create Blobs and Tree
    console.log('Preparing commit...');
    const tree: any[] = [];
    
    for (const file of files) {
      const filePath = path.join(rootDir, file);
      const contentBuffer = fs.readFileSync(filePath);
      
      const { data: blobInfo } = await octokit.rest.git.createBlob({
        owner,
        repo: name,
        content: contentBuffer.toString('base64'),
        encoding: 'base64',
      });

      tree.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blobInfo.sha,
      });
    }

    // 4. Create Tree
    const { data: mainBranch } = await octokit.rest.repos.getBranch({
      owner,
      repo: name,
      branch: repo.default_branch || 'main'
    }).catch(async () => {
      return octokit.rest.repos.getBranch({
        owner,
        repo: name,
        branch: 'master'
      })
    });

    const baseTreeSha = mainBranch.commit.commit.tree.sha;

    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo: name,
      base_tree: baseTreeSha,
      tree,
    });

    // 5. Create Commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo: name,
      message: 'Initial commit from AI Studio',
      tree: newTree.sha,
      parents: [mainBranch.commit.sha],
    });

    // 6. Update reference
    await octokit.rest.git.updateRef({
      owner,
      repo: name,
      ref: `heads/${mainBranch.name}`,
      sha: newCommit.sha,
    });
    
    res.json({ success: true, url: repo.html_url });
  } catch (err: any) {
    console.error('Publishing failed:', err);
    res.status(500).json({ error: err.message || 'An error occurred during publishing.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
