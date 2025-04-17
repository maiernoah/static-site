const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function deploy() {
    try {
        // Build the site
        console.log('Building site...');
        await new Promise((resolve, reject) => {
            exec('node build.js', (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Create a temporary directory for gh-pages
        const tempDir = path.join(__dirname, 'gh-pages-temp');
        await fs.ensureDir(tempDir);

        // Copy the public directory to temp
        await fs.copy('public', tempDir);

        // Initialize git in temp directory
        await new Promise((resolve, reject) => {
            exec('git init', { cwd: tempDir }, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Add all files
        await new Promise((resolve, reject) => {
            exec('git add .', { cwd: tempDir }, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Commit
        await new Promise((resolve, reject) => {
            exec('git commit -m "Deploy to GitHub Pages"', { cwd: tempDir }, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Add the remote (if not already added)
        try {
            await new Promise((resolve, reject) => {
                exec('git remote add origin https://github.com/noahmaier/Static-Site.git', { cwd: tempDir }, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        } catch (e) {
            // Remote might already exist, that's okay
        }

        // Force push to gh-pages branch
        console.log('Pushing to GitHub Pages...');
        await new Promise((resolve, reject) => {
            exec('git push -f origin master:gh-pages', { cwd: tempDir }, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Clean up
        await fs.remove(tempDir);
        console.log('Deployment complete!');
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

deploy(); 