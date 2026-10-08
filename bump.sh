#!/bin/sh
# Run before each commit: stamps a new build number so phones pick up the update.
B=$(date +%Y%m%d%H%M%S)
sed -i "s/var APP_BUILD='[0-9]*'/var APP_BUILD='$B'/" index.html
echo $B > version.txt
