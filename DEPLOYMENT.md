# Deploying deBricks to Namecheap

This website is fully static and does not need a database, server process, or third-party package.

## Fastest deployment

1. Run `npm run build` from this folder.
2. In Namecheap cPanel, open **File Manager** and go to `public_html`.
3. Upload the **contents** of the generated `dist` folder—not the `dist` folder itself.
4. Confirm that `index.html` and `.htaccess` are directly inside `public_html`.
5. Open the domain and test the navigation and contact button.

The contact form opens the visitor's email application with their message addressed to `hi@debricks.com`, so no server-side form setup is required.

## Updating the site later

Edit `index.html`, `styles.css`, `script.js`, or files inside `assets`, run `npm run build` again, then replace the corresponding files in `public_html`.

The archived `old` folder is intentionally excluded from `dist` and will not be published.
