# Sanity

##Web site
### Web site Building
For thoses lazy people:
```
./start.sh
```

For guys who love details:

```
# Fetching submodules
git submodule init
git submodule update
# Installing node packages
cd www/src/build/Sting/
npm install 
cd ../../

# Production build
node build.js

# Development build
node build.js debug

# Continuos building, launch a build each time a file is modified
npm install node-watch
node buider-watcher debug
```

Once the build process has been completed successfully, we should serve the folder 'www' using any webserver. After that go to:
```
http://<serveraddress>:<serverport>/es
```

### Web site deploy - Amazon Cloud Front

First time:
```
gem install s3_website
cp www/s3_website.changes.yml www/s3_website.yml 
cd www/src
node build.js
cd ..
s3_website cfg apply
s3_website push
```

Updates :
```
cd www/src
node build.js
cd ..
s3_website push 
```
