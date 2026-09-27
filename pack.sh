#!/usr/bin/env bash
set -e
zip -r extension.zip manifest.json content.js popup.html popup.js aggressive-youtube-filter-sharp-128.png
echo "Created extension.zip"
