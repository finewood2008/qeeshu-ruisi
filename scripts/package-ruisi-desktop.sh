#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR"
CONFIG_FILE="$APP_DIR/electron-builder.json"
TARGET="${1:-default}"
BUILDER_VERSION="${ELECTRON_BUILDER_VERSION:-25.1.8}"
AUTO_INSTALL_DEPS="${AUTO_INSTALL_DEPS:-1}"
DISABLE_CODESIGN="${DISABLE_CODESIGN:-1}"

usage() {
  cat <<'EOF'
Ruisi 桌面版打包脚本

Usage:
  bash scripts/package-ruisi-desktop.sh [target]

Targets:
  default   当前平台默认产物（macOS 下等同于 dmg+zip）
  dmg       仅打 macOS dmg
  zip       仅打 zip
  dir       只生成未封装 app 目录

Environment:
  APP_VERSION=0.1.0          覆盖 package.json 版本号打包
  AUTO_INSTALL_DEPS=1        node_modules 缺失时自动 npm install
  DISABLE_CODESIGN=1         默认关闭签名，避免本地无证书时打包失败
  ELECTRON_BUILDER_VERSION   electron-builder 版本，默认 25.1.8

Examples:
  bash scripts/package-ruisi-desktop.sh
  bash scripts/package-ruisi-desktop.sh dmg
  APP_VERSION=0.1.3 bash scripts/package-ruisi-desktop.sh
EOF
}

log() {
  printf '[package-ruisi] %s\n' "$*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

if [[ "${TARGET:-}" == "-h" || "${TARGET:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_cmd node
require_cmd npm
require_cmd npx

if [[ ! -d "$APP_DIR" ]]; then
  echo "Ruisi app directory not found: $APP_DIR" >&2
  exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "electron-builder config not found: $CONFIG_FILE" >&2
  exit 1
fi

if [[ ! -d "$APP_DIR/node_modules" ]]; then
  if [[ "$AUTO_INSTALL_DEPS" == "1" ]]; then
    log "node_modules 不存在，执行 npm install"
    (
      cd "$APP_DIR"
      npm install
    )
  else
    echo "node_modules not found. Run npm install in $APP_DIR first." >&2
    exit 1
  fi
fi

PACKAGE_VERSION="$(
  cd "$APP_DIR"
  node -p "require('./package.json').version"
)"

if [[ -n "${APP_VERSION:-}" ]]; then
  PACKAGE_VERSION="$APP_VERSION"
fi

log "app dir: $APP_DIR"
log "target: $TARGET"
log "version: $PACKAGE_VERSION"

(
  cd "$APP_DIR"

  log "构建前端静态资源"
  npm run build:desktop

  if [[ "$DISABLE_CODESIGN" == "1" ]]; then
    export CSC_IDENTITY_AUTO_DISCOVERY=false
  fi

  export GH_TOKEN="${GH_TOKEN:-}"

  BUILDER_ARGS=(
    --config "$CONFIG_FILE"
    --publish never
    --config.extraMetadata.version="$PACKAGE_VERSION"
  )

  case "$TARGET" in
    default)
      if [[ "$OSTYPE" == darwin* ]]; then
        BUILDER_ARGS+=(--mac dmg zip)
      elif [[ "$OSTYPE" == linux* ]]; then
        BUILDER_ARGS+=(--linux AppImage tar.gz)
      else
        BUILDER_ARGS+=(--dir)
      fi
      ;;
    dmg)
      BUILDER_ARGS+=(--mac dmg)
      ;;
    zip)
      if [[ "$OSTYPE" == darwin* ]]; then
        BUILDER_ARGS+=(--mac zip)
      elif [[ "$OSTYPE" == linux* ]]; then
        BUILDER_ARGS+=(--linux zip)
      else
        BUILDER_ARGS+=(--win zip)
      fi
      ;;
    dir)
      BUILDER_ARGS+=(--dir)
      ;;
    *)
      echo "Unsupported target: $TARGET" >&2
      usage
      exit 1
      ;;
  esac

  log "开始 electron-builder 打包"
  npx -y "electron-builder@${BUILDER_VERSION}" "${BUILDER_ARGS[@]}"
)

log "打包完成，产物目录：$APP_DIR/release"
find "$APP_DIR/release" -maxdepth 1 -type f \
  \( -name "*.dmg" -o -name "*.zip" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.tar.gz" \) \
  -print | sed 's#^#[package-ruisi] artifact: #'
