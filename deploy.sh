#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh \"your commit message\""
    exit 1
fi

if [ ! -f /Users/hunto/Downloads/index.html ]; then
    echo "Error: /Users/hunto/Downloads/index.html not found"
    exit 1
fi

cp /Users/hunto/Downloads/index.html /Users/hunto/Documents/GitHub/hunto-site/index.html
echo "Copied index.html from Downloads"

git add index.html
git commit -m "$1"
echo "Committed: $1"

git push origin main
if [ $? -eq 0 ]; then
    echo "Pushed to GitHub"
    rm /Users/hunto/Downloads/index.html
    echo "Deleted index.html from Downloads"
else
    echo "Error: Push failed. File NOT deleted from Downloads."
    exit 1
fi

echo "Done!"
