rsync -r src/ docs/
rsync  build/contracts/* docs/
git add .
git commit -m "update app.js"
git push -u origin master