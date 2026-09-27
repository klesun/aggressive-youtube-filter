#!/usr/bin/env bash
set -e
zip -r extension.zip manifest.json content.js aggressive-youtube-filter-sharp.png
echo "Created extension.zip"
