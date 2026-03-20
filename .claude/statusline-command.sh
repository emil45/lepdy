#!/bin/bash

# Read and parse all JSON fields in a single jq call (tab-separated)
IFS=$'\t' read -r project_dir model context_size input_tokens output_tokens cache_create cache_read used_pct < <(
  jq -r '[
    .workspace.project_dir,
    .model.display_name,
    (.context_window.context_window_size // 0),
    (.context_window.current_usage.input_tokens // 0),
    (.context_window.current_usage.output_tokens // 0),
    (.context_window.current_usage.cache_creation_input_tokens // 0),
    (.context_window.current_usage.cache_read_input_tokens // 0),
    (.context_window.used_percentage // 0)
  ] | @tsv' <<< "$(cat)"
)

# Pastel colors
RST='\033[0m'
DIM='\033[38;5;245m'
BLUE='\033[38;5;110m'
PURPLE='\033[38;5;183m'
GREEN='\033[38;5;114m'
YELLOW='\033[38;5;186m'
ORANGE='\033[38;5;216m'
RED='\033[38;5;167m'
DARK='\033[38;5;239m'

# Project name (basename of project dir)
proj="${project_dir##*/}"

# Git branch + dirty state
cd "$project_dir" 2>/dev/null
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
git_info=''
if [ -n "$branch" ]; then
  dirty=''
  [ -n "$(git status --porcelain 2>/dev/null)" ] && dirty=' ✱'
  git_info=" | $(printf "${PURPLE}")${branch}${dirty}$(printf "${RST}")"
fi

# Format number with commas (pure bash, works on macOS)
fmt() {
  local n="$1" r=""
  while [ ${#n} -gt 3 ]; do
    r=",${n: -3}$r"
    n="${n:0:${#n}-3}"
  done
  printf '%s' "${n}${r}"
}

# Context window bar
ctx=''
if [ "${context_size:-0}" -gt 0 ] 2>/dev/null; then
  used_tokens=$((input_tokens + output_tokens + cache_create + cache_read))
  percent=$((used_tokens * 100 / context_size))

  # Pick bar color
  if [ $percent -lt 50 ]; then
    BAR_C="$GREEN"
  elif [ $percent -lt 70 ]; then
    BAR_C="$YELLOW"
  elif [ $percent -lt 85 ]; then
    BAR_C="$ORANGE"
  else
    BAR_C="$RED"
  fi

  # Build bar with block characters (█ filled, ░ empty)
  bar_w=15
  filled=$((percent * bar_w / 100))
  empty=$((bar_w - filled))

  bar=""
  [ $filled -gt 0 ] && bar="$(printf "${BAR_C}")$(printf '█%.0s' $(seq 1 $filled))"
  [ $empty -gt 0 ] && bar="${bar}$(printf "${DARK}")$(printf '░%.0s' $(seq 1 $empty))"
  bar="${bar}$(printf "${RST}")"

  ctx="${bar} $(printf "${BAR_C}")$(fmt $used_tokens)$(printf "${RST}")$(printf "${DIM}") / $(fmt $context_size) (${percent}%)$(printf "${RST}")"
fi

# Output
printf "$(printf "${BLUE}")%s$(printf "${RST}") | %s%s | %s\n" \
  "$proj" "$model" "$git_info" "$ctx"
