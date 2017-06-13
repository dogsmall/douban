echo production > ./env
mkdir node_modules
cp -r ./lib/* node_modules
npm install --registry=https://registry.npm.taobao.org