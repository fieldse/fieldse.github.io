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

read -rp "Categories (space-separated, or leave blank): " categories_input
read -rp "Tags (space-separated, or leave blank): " tags_input

categories_yaml=""
tags_yaml=""

if [ -n "$categories_input" ]; then
  formatted=$(echo "$categories_input" | tr -s ' ' | sed 's/ /, /g')
  categories_yaml="categories: [$formatted]"$'\n'
fi

if [ -n "$tags_input" ]; then
  formatted=$(echo "$tags_input" | tr -s ' ' | sed 's/ /, /g')
  tags_yaml="tags: [$formatted]"$'\n'
fi

cat > "$file" <<EOF
---
layout: post
title: "$title"
date: $date
${categories_yaml}${tags_yaml}---

EOF

vim "$file"
