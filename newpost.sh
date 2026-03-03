#!/bin/bash
set -e

CONTENT_DIR=docs/_posts
title="$*"
if [ -z "$title" ]; then
  echo "Usage: newpost.sh <title>" >&2
  exit 1
fi

date=$(date +%Y-%m-%d)
slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
file="$CONTENT_DIR/${date}-${slug}.md"

mkdir -p $CONTENT_DIR

cat > "$file" <<EOF
---
layout: post
title: "$title"
date: $date
---

EOF

vim "$file"
