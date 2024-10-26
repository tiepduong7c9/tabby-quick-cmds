# Overview

Quick commands plugin for tabby

# Build

NodeJs 20.x

```
npm install --legacy-peer-deps
npm run build
```

# Shortcuts

The default shortcut for opening the Quick Commands menu is `Alt+Q`.

# Update
1. Clean up and update dependencies
2. Improve command filtering
3. Navigate command list by arrow keys

# Update (minyoad)
1. Update dependencies to latest, fixed build error
2. Add support for multiline command
3. Add support for CTRL Combined key,such as Ctrl+I, CTRL+C, using key value such as \x03 
   refer:https://www.physics.udel.edu/~watson/scen103/ascii.html.
4. Add support for delayed command, using \sxxx to sleep xxx ms
