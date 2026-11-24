#!/bin/bash
# Grader-style mount sim for SUNSET KEYS v4.
# tmpfs as /output, read-only repo bind mount, setpriv 65534:65534,
# no network (unshare -n), foreign cwd (/), exact grader env.
# Runs main.ts twice into two outputs; both must exit 0 and be byte-identical.
set -u
REPO="$HOME/workspace/makefun/gta6-01-v4-entry"
WORK=/tmp/gta6-v4-sim
NODE="$(which node)"
rm -rf "$WORK"
mkdir -p "$WORK/bot" "$WORK/out1" "$WORK/out2"
chmod 755 "$WORK"
cp -a "$REPO/." "$WORK/bot/"
chmod -R a+rX "$WORK/bot"
chmod 777 "$WORK/out1" "$WORK/out2"

unshare --mount --net bash -c "
  set -e
  mkdir -p /bot
  mount --bind $WORK/bot /bot
  mount -o bind,remount,ro /bot
  mount -t tmpfs tmpfs $WORK/out1
  mount -t tmpfs tmpfs $WORK/out2
  chmod 777 $WORK/out1 $WORK/out2
  cd /
  echo '--- run 1 (out1) ---'
  env -i PATH=/usr/local/bin:/usr/bin:/bin HOME=/nonexistent TZ=UTC LANG=C.UTF-8 PYTHONHASHSEED=0 MAKEFUN_BOT_DIR=/bot MAKEFUN_OUTPUT_DIR=$WORK/out1 setpriv --reuid=65534 --regid=65534 --clear-groups $NODE $WORK/bot/main.ts
  echo '--- run 2 (out2) ---'
  env -i PATH=/usr/local/bin:/usr/bin:/bin HOME=/nonexistent TZ=UTC LANG=C.UTF-8 PYTHONHASHSEED=0 MAKEFUN_BOT_DIR=/bot MAKEFUN_OUTPUT_DIR=$WORK/out2 setpriv --reuid=65534 --regid=65534 --clear-groups $NODE $WORK/bot/main.ts
  echo '--- diff out1 vs out2 (inside the namespace, before mounts vanish) ---'
  diff -r $WORK/out1 $WORK/out2 && echo 'BYTE-IDENTICAL'
  sha256sum $WORK/out1/dossier.json $WORK/out2/dossier.json
  ls $WORK/out1 $WORK/out1/game | head -20
"
