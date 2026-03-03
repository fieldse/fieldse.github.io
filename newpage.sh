#!/bin/bash
set -e

CONTENT_DIR=docs

title="$*"
if [ -z "$title" ]; then
  echo "Usage: newpage.sh <title>" >&2
  exit 1
fi

slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
file="$CONTENT_DIR/${slug}.md"

mkdir -p $CONTENT_DIR

cat > "$file" <<EOF
---
layout: page
title: "$title"
---

EOF

vim "$file"
