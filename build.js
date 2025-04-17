const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

// Template function to wrap content in HTML
const wrapInTemplate = (content, title, isPost = false) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - My Website</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav>
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
    </nav>
    <main>
        ${isPost ? '<article class="blog-post">' : ''}
        ${content}
        ${isPost ? '</article>' : ''}
    </main>
    <footer>
        <p>&copy; ${new Date().getFullYear()} My Website. All rights reserved.</p>
    </footer>
</body>
</html>
`;

// Process a markdown file
async function processMarkdown(filePath, isPost = false) {
    const content = await fs.readFile(filePath, 'utf-8');
    const html = marked(content);
    const title = path.basename(filePath, '.md');
    return wrapInTemplate(html, title, isPost);
}

// Build the site
async function build() {
    // Ensure public directory exists
    await fs.ensureDir('public');
    await fs.ensureDir('public/blog');

    // Copy static assets
    await fs.copy('src/css', 'public/css', { overwrite: true });
    await fs.copy('src/js', 'public/js', { overwrite: true });

    // Process pages
    const pages = await fs.readdir('src/content/pages');
    for (const page of pages) {
        if (page.endsWith('.md')) {
            const html = await processMarkdown(`src/content/pages/${page}`);
            await fs.writeFile(`public/${page.replace('.md', '.html')}`, html);
        }
    }

    // Process blog posts
    const posts = await fs.readdir('src/content/blog');
    const blogPosts = [];
    for (const post of posts) {
        if (post.endsWith('.md')) {
            const html = await processMarkdown(`src/content/blog/${post}`, true);
            await fs.writeFile(`public/blog/${post.replace('.md', '.html')}`, html);
            
            // Add to blog posts list
            const content = await fs.readFile(`src/content/blog/${post}`, 'utf-8');
            const title = content.split('\n')[0].replace('#', '').trim();
            blogPosts.push({
                title,
                url: `/blog/${post.replace('.md', '.html')}`,
                date: post.split('-')[0] // Assuming format: YYYY-MM-DD-title.md
            });
        }
    }

    // Create blog index
    const blogIndex = `
        <h1>Blog Posts</h1>
        <ul class="blog-list">
            ${blogPosts
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(post => `
                    <li>
                        <a href="${post.url}">${post.title}</a>
                        <span class="date">${post.date}</span>
                    </li>
                `).join('')}
        </ul>
    `;
    await fs.writeFile('public/blog/index.html', wrapInTemplate(blogIndex, 'Blog'));
}

build().catch(console.error); 