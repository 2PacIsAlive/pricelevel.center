# pricelevel.center

> Combined order book data for cryptocurrency exchanges 

## development

### installation
```bash
git clone https://github.com/2PacIsAlive/pricelevel.center.git && \
cd pricelevel.center && \ 
export PRICE_LEVEL_CENTER=`pwd` && \
\
cd $PRICE_LEVEL_CENTER/api && \
npm i && \
pm2 start app.js && \
\
cd $PRICE_LEVEL_CENTER/ui && \
npm i && \
npm run build && \
cp -r dist/* /var/www/html/
```

### tests
```bash
cd $PRICE_LEVEL_CENTER/api && \
npm test
```
