rsync -r src/ docs/
rsync  build/contracts/* docs/
git add .
git commit -m "Compiles assets for Github Pages"
git remote add origin git@github.com:absonkab/ABT_token_sale.git
git push -u origin master