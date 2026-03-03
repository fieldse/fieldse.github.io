#!/bin/bash
set -e

title="$*"
if [ -z "$title" ]; then
  echo "Usage: newpost.sh <title>" >&2
  exit 1
fi

date=$(date +%Y-%m-%d)
slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
file="_posts/${date}-${slug}.md"

mkdir -p _posts

cat > "$file" <<EOF
---
layout: post
title: "$title"
date: $date
---

EOF

vim "$file"
