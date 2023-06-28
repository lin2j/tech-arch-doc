#!/bin/bash

# 要处理的文件后缀列表
suffixes=("md")

# 遍历后缀列表
for suffix in "${suffixes[@]}"; do
  # 使用 find 命令获取匹配特定后缀的文件列表
  IFS=$'\n' files=$(find . -type f -name "*.$suffix")
  
  # 遍历文件列表
  for file in $files; do
    # 使用 sed 命令替换文件中的文本
    sed -i -E 's/\(\[剑指 Offer\)/原始题目：\1/g' "$file"
  done
done


rm -rf *.md-E
