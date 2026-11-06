"""把 claude-skills 儲存庫新增的技能補進 skills.html 的 catalog（Claude 專用技能）。

規則：
- 只「新增」缺少的技能，不改動已手動整理的項目。
- 技能名稱已出現在 skills.html（任何區塊，例如網路上分享的技能）就略過。
- SKIP 環境變數列出的資料夾略過（例如已用 hyperframes 一張卡代表的子技能）。
- 用途說明優先取 claude-skills README 技能清單的「用途」欄，沒有再用 SKILL.md 的 description。

本機測試：LOCAL_SOURCE=/path/to/claude-skills python3 .github/scripts/sync_claude_skills.py
"""
import json
import os
import re
import urllib.request

REPO = os.environ.get("SOURCE_REPO", "hsiang0422-star/claude-skills")
LOCAL = os.environ.get("LOCAL_SOURCE")
SKIP = {s.strip() for s in os.environ.get("SKIP", "").split(",") if s.strip()}
PAGE = "skills.html"


def fetch(url):
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "toolbox-sync"})
    with urllib.request.urlopen(req) as r:
        return r.read().decode("utf-8")


def list_skills():
    if LOCAL:
        return sorted(d for d in os.listdir(LOCAL)
                      if os.path.isfile(os.path.join(LOCAL, d, "SKILL.md")))
    items = json.loads(fetch(f"https://api.github.com/repos/{REPO}/contents"))
    return sorted(i["name"] for i in items if i["type"] == "dir" and not i["name"].startswith("."))


def read_file(path):
    if LOCAL:
        p = os.path.join(LOCAL, path)
        return open(p, encoding="utf-8").read() if os.path.exists(p) else ""
    try:
        return fetch(f"https://raw.githubusercontent.com/{REPO}/main/{path}")
    except Exception:
        return ""


def readme_purposes():
    out = {}
    for m in re.finditer(r"^\| \[([^\]]+)\]\(\./[^)]+\) \| ([^|]+) \|", read_file("README.md"), re.M):
        out[m.group(1)] = m.group(2).strip()
    return out


def skill_description(name):
    text = read_file(f"{name}/SKILL.md")
    if not text:
        return None
    m = re.search(r"^description:\s*(.+)$", text, re.M)
    return m.group(1).strip().strip("\"'")[:120] if m else ""


def main():
    html = open(PAGE, encoding="utf-8").read()
    marker = "const catalog="
    start = html.find(marker)
    if start < 0:
        raise SystemExit("找不到 const catalog= 標記")
    i = start + len(marker)
    depth, j = 0, i
    in_str = False
    while j < len(html):
        ch = html[j]
        if in_str:
            if ch == "\\":
                j += 1
            elif ch == '"':
                in_str = False
        elif ch == '"':
            in_str = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                break
        j += 1
    catalog = json.loads(html[i:j + 1])

    purposes = readme_purposes()
    added = []
    for name in list_skills():
        if name in SKIP:
            continue
        if re.search(r'["/:]' + re.escape(name) + r'"', html) or f"/claude-skills/tree/main/{name}\"" in html:
            continue
        desc = purposes.get(name) or skill_description(name)
        if desc is None:
            continue  # 不是技能資料夾
        catalog.insert(0, [f"claude:{name}", "Claude 專用", desc or name])
        added.append(name)

    if not added:
        print("沒有需要新增的技能")
        return
    new = json.dumps(catalog, ensure_ascii=False, separators=(",", ":"))
    open(PAGE, "w", encoding="utf-8").write(html[:i] + new + html[j + 1:])
    print("已新增：" + ", ".join(added))


if __name__ == "__main__":
    main()
